var path = require('path'),
    mockFs = require('mock-fs'),
    naming = require('bem-naming'),
    cwd = process.cwd(),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/levels');

describe('techs', function () {
    describe('levels', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must detect block file in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                }
            };

            hasFile(scheme, 'block.ext', done);
        });

        it('must detect block dir in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        'block.ext': {}
                    }
                }
            };

            hasDir(scheme, 'block.ext', done);
        });

        it('must detect boolean mod file of block in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '_bool-mod': {
                            'block_bool-mod.ext': ''
                        }
                    }
                }
            };

            hasFile(scheme, 'block_bool-mod.ext', done);
        });

        it('must detect boolean mod dir of block in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '_bool-mod': {
                            'block_bool-mod.ext': {}
                        }
                    }
                }
            };

            hasDir(scheme, 'block_bool-mod.ext', done);
        });

        it('must detect mod file of block in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '_mod-name': {
                            'block_mod-name_mod-val.ext': ''
                        }
                    }
                }
            };

            hasFile(scheme, 'block_mod-name_mod-val.ext', done);
        });

        it('must detect mod dir of block in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '_mod-name': {
                            'block_mod-name_mod-val.ext': {}
                        }
                    }
                }
            };

            hasDir(scheme, 'block_mod-name_mod-val.ext', done);
        });

        it('must detect elem file of block in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            'block__elem-name.ext': ''
                        }
                    }
                }
            };

            hasFile(scheme, 'block__elem-name.ext', done);
        });

        it('must detect elem dir of block in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            'block__elem-name.ext': {}
                        }
                    }
                }
            };

            hasDir(scheme, 'block__elem-name.ext', done);
        });

        it('must detect boolean mod file of elem in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            '_bool-mod': {
                                'block__elem-name_bool-mod.ext': ''
                            }
                        }
                    }
                }
            };

            hasFile(scheme, 'block__elem-name_bool-mod.ext', done);
        });

        it('must detect boolean mod file of elem in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            '_bool-mod': {
                                'block__elem-name_bool-mod.ext': {}
                            }
                        }
                    }
                }
            };

            hasDir(scheme, 'block__elem-name_bool-mod.ext', done);
        });

        it('must detect mod file of elem in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            '_mod-name': {
                                'block__elem-name_mod-name_mod-val.ext': ''
                            }
                        }
                    }
                }
            };

            hasFile(scheme, 'block__elem-name_mod-name_mod-val.ext', done);
        });

        it('must detect mod dir of elem in level', function (done) {
            var scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            '_mod-name': {
                                'block__elem-name_mod-name_mod-val.ext': {}
                            }
                        }
                    }
                }
            };

            hasDir(scheme, 'block__elem-name_mod-name_mod-val.ext', done);
        });

        it('must detect block files in levels', function (done) {
            var scheme = {
                'common.blocks': {
                    block: {
                        'block.ext': ''
                    }
                },
                'desktop.blocks': {
                    block: {
                        'block.ext': ''
                    }
                }
            };

            getLevels(scheme)
                .then(function (levels) {
                    var files = getFiles(levels, 'block');

                    files[0].fullname.must.be(path.join(cwd, 'common.blocks/block/block.ext'));
                    files[1].fullname.must.be(path.join(cwd, 'desktop.blocks/block/block.ext'));
                })
                .then(done, done);
        });

        it('must detect block dirs in levels', function (done) {
            var scheme = {
                'common.blocks': {
                    block: {
                        'block.ext': {}
                    }
                },
                'desktop.blocks': {
                    block: {
                        'block.ext': {}
                    }
                }
            };

            getLevels(scheme)
                .then(function (levels) {
                    var dirs = getDirs(levels, 'block');

                    dirs[0].fullname.must.be(path.join(cwd, 'common.blocks/block/block.ext'));
                    dirs[1].fullname.must.be(path.join(cwd, 'desktop.blocks/block/block.ext'));
                })
                .then(done, done);
        });

        it('must handle full paths', function (done) {
            mockFs({
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                },
                bundle: {}
            });

            var bundle = new TestNode('bundle'),
                levelDirname = path.join(cwd, 'blocks');

            bundle.runTech(Tech, { levels: [levelDirname] })
                .then(function (levels) {
                    var files = getFiles(levels, 'block');

                    files[0].name.must.be('block.ext');
                    files.must.have.length(1);
                })
                .then(done, done);
        });
    });
});

function getLevels(fsScheme) {
    var levels = Object.keys(fsScheme),
        bundle;

    fsScheme['bundle'] = {};
    mockFs(fsScheme);

    bundle = new TestNode('bundle');

    return bundle.runTech(Tech, { levels: levels });
}

function getEntityFiles(levels, entity, field) {
    var notation = naming.parse(entity);

    if (notation.elem) {
        return levels.getElemEntities(notation.block, notation.elem, notation.modName, notation.modVal)[field];
    } else {
        return levels.getBlockEntities(notation.block, notation.modName, notation.modVal)[field];
    }
}

function getFiles(levels, entity) {
    return getEntityFiles(levels, entity, 'files');
}

function getDirs(levels, entity) {
    return getEntityFiles(levels, entity, 'dirs');
}

function hasEntity(fsScheme, filename, field, done) {
    getLevels(fsScheme)
        .then(function (levels) {
            var name = filename.split('.')[0],
                files = getEntityFiles(levels, name, field);

            files[0].name.must.be(filename);
            files.must.have.length(1);
        })
        .then(done, done);
}

function hasFile(fsScheme, filenames, done) {
    hasEntity(fsScheme, filenames, 'files', done);
}

function hasDir(fsScheme, filenames, done) {
    hasEntity(fsScheme, filenames, 'dirs', done);
}
