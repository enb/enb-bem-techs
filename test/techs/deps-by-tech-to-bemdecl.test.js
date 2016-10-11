var path = require('path'),

    vow = require('vow'),
    mockFs = require('mock-fs'),
    FileList = require('enb/lib/file-list'),
    TestNode = require('mock-enb/lib/mock-node'),

    techs = require('../..'),
    levelsTech = techs.levels,
    filesTech = techs.files,
    depsTech = techs.deps,
    depsByTechToBemdecl = techs.depsByTechToBemdecl;

describe('techs: deps-by-tech-to-bemdecl', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must provide result from cache', function () {
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
                'bundle.bemdecl.js': 'exports.blocks = ' + JSON.stringify([{ name: 'block' }]) + ';'
            }
        });

        var bundle = new TestNode('bundle'),
            depsFiles = new FileList(),
            cache = bundle.getNodeCache('bundle.bemdecl.js'),
            options = {
                sourceTech: 'sourceTech'
            };

        depsFiles.addFiles([FileList.getFileInfo(path.join('blocks', 'block', 'block.deps.js'))]);

        cache.cacheFileInfo('bemdecl-file', path.resolve('bundle/bundle.bemdecl.js'));
        cache.cacheFileList('deps-files', depsFiles.getBySuffix('deps.js'));

        bundle.provideTechData('?.files', new FileList());

        return bundle.runTech(depsByTechToBemdecl, options)
            .then(function (target) {
                target.blocks.must.eql([]);
            });
    });

    it('must support deps format for BEMDECL', function () {
        var scheme = {
                blocks: {
                    block: {
                        'block.deps.js': stringifyDepsJs({
                            tech: 'sourceTech',
                            shouldDeps: [{ block: 'other-block' }]
                        })
                    }
                }
            },
            bemdecl = [{ name: 'block' }],
            exepted = [{ block: 'other-block' }];

        return assert(scheme, bemdecl, exepted, {
            sourceTech: 'sourceTech',
            bemdeclFormat: 'deps'
        });
    });

    describe('deps.js format', function () {
        it('must respect context for block', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'block' }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }],
                exepted = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for boolean mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: true }] }] }],
                exepted = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for elem', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }],
                exepted = [{ name: 'block', elems: [{ name: 'elem' }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for elem mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', elems: [
                    { name: 'elem', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }
                ] }],
                exepted = [{ name: 'block', elems: [
                    { name: 'elem', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }
                ] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must respect context for boolean mod of elem', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', elems: [
                    { name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }
                ] }],
                exepted = [{ name: 'block', elems: [
                    { name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }
                ] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect context 1', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }],
                exepted = [{ name: 'other-block' }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect mod context for other block', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }],
                exepted = [{ name: 'other-block' }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect mod val context for other mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }],
                exepted = [{ name: 'block', mods: [{ name: 'other-mod', vals: [{ name: true }] }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must not respect elem context for other elem', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block', elems: [
                    { name: 'elem', mods: [{ name: 'mod', vals: [{ name: 'val' }] }] }
                ] }],
                exepted = [{ name: 'block', elems: [{ name: 'other-elem' }] }];

            return assert(scheme, bemdecl, exepted, { sourceTech: 'sourceTech', destTech: 'destTech' });
        });

        it('must add should dep of block', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: [{ block: 'other-block' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of block boolean mod', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of block mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elem', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block', elems: [{ name: 'elem' }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elems', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [
                    { name: 'other-block' },
                    { name: 'other-block', elems: [{ name: 'elem-1' }] },
                    { name: 'other-block', elems: [{ name: 'elem-2' }] }
                ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elem bool mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add should dep of elem mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add loop shouldDeps', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'A' }],
                exepted = [
                    // { name: 'A' },
                    { name: 'B' }
                ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                mustDeps: [{ block: 'other-block' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block' }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block boolean mod', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                mustDeps: [{ block: 'other-block', mods: { mod: true } }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block boolean mod with short record', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                mustDeps: [{ block: 'other-block', mod: 'mod' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block', mods: [{ name: 'mod', vals: [{ name: true }] }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of block mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                mustDeps: [{ block: 'other-block', elem: 'elem' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{ name: 'other-block', elems: [{ name: 'elem' }] }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elems', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                mustDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
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

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem bool mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem bool mod with short record', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [{ name: true }] }] }]
                }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add must dep of elem mod', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [{
                    name: 'other-block',
                    elems: [{ name: 'elem', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }]
                }];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add loop shouldDeps', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'A' }],
                exepted = [
                    // { name: 'A' },
                    { name: 'B' }
                ];

            return assert(scheme, bemdecl, exepted);
        });

        it('must add blocks only with `tech`', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [
                    { name: 'block-with-destTech' }
                ];

            return assert(scheme, bemdecl, exepted, {
                sourceTech: 'sourceTech',
                destTech: 'destTech'
            });
        });

        it('must add block with `tech` if `destTech` option not specified', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.deps.js': stringifyDepsJs({
                                tech: 'sourceTech',
                                mustDeps: [{ block: 'block-with-destTech', tech: 'destTech' }]
                            })
                        }
                    }
                },
                bemdecl = [{ name: 'block' }],
                exepted = [
                    { name: 'block-with-destTech' }
                ];

            return assert(scheme, bemdecl, exepted);
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
                exepted = [];

            return assert(scheme, bemdecl, exepted);
        });

        it('must skip dependency files with commented code', function () {
            var scheme = {
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
                },
                bemdecl = [{ name: 'block' }],
                exepted = [];

            return assert(scheme, bemdecl, exepted);
        });
    });
});

function getResults(fsScheme, bemdecl, options) {
    var levels = Object.keys(fsScheme),
        bundle;

    options || (options = {});
    options.sourceTech || (options.sourceTech = 'sourceTech');

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
                bundle.runTechAndGetResults(depsByTechToBemdecl, options),
                bundle.runTechAndRequire(depsByTechToBemdecl, options)
            ]);
        })
        .spread(function (target1, target2) {
            if (options.bemdeclFormat === 'deps') {
                return [target1['bundle.bemdecl.js'].deps, target2[0].deps];
            } else {
                return [target1['bundle.bemdecl.js'].blocks, target2[0].blocks];
            }
        });
}

function assert(fsScheme, bemdecl, exepted, options) {
    return getResults(fsScheme, bemdecl, options)
        .then(function (results) {
            results.forEach(function (actualBemdecl) {
                actualBemdecl.must.eql(exepted);
            });
        });
}

function stringifyDepsJs(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}
