var path = require('path'),
    mockFs = require('mock-fs'),
    naming = require('bem-naming'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/levels');

describe('techs', function () {
    describe('levels', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must detect block file in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.ext': ''
                        }
                    }
                },
                files = ['blocks/block/block.ext'];

            return hasFiles(scheme, files);
        });

        it('must detect block dir in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.ext': {}
                        }
                    }
                },
                dirs = ['blocks/block/block.ext'];

            return hasDirs(scheme, dirs);
        });

        it('must detect boolean mod file of block in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_bool-mod': {
                                'block_bool-mod.ext': ''
                            }
                        }
                    }
                },
                files = ['blocks/block/_bool-mod/block_bool-mod.ext'];

            return hasFiles(scheme, files);
        });

        it('must detect boolean mod dir of block in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_bool-mod': {
                                'block_bool-mod.ext': {}
                            }
                        }
                    }
                },
                dirs = ['blocks/block/_bool-mod/block_bool-mod.ext'];

            return hasDirs(scheme, dirs);
        });

        it('must detect mod file of block in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_mod-name': {
                                'block_mod-name_mod-val.ext': ''
                            }
                        }
                    }
                },
                files = ['blocks/block/_mod-name/block_mod-name_mod-val.ext'];

            return hasFiles(scheme, files);
        });

        it('must detect mod dir of block in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_mod-name': {
                                'block_mod-name_mod-val.ext': {}
                            }
                        }
                    }
                },
                dirs = ['blocks/block/_mod-name/block_mod-name_mod-val.ext'];

            return hasDirs(scheme, dirs);
        });

        it('must detect elem file of block in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '__elem-name': {
                                'block__elem-name.ext': ''
                            }
                        }
                    }
                },
                files = ['blocks/block/__elem-name/block__elem-name.ext'];

            return hasFiles(scheme, files);
        });

        it('must detect elem dir of block in level', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '__elem-name': {
                                'block__elem-name.ext': {}
                            }
                        }
                    }
                },
                dirs = ['blocks/block/__elem-name/block__elem-name.ext'];

            return hasDirs(scheme, dirs);
        });

        it('must detect boolean mod file of elem in level', function () {
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
                },
                files = ['blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'];

            return hasFiles(scheme, files);
        });

        it('must detect boolean mod dir of elem in level', function () {
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
                },
                dirs = ['blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'];

            return hasDirs(scheme, dirs);
        });

        it('must detect mod file of elem in level', function () {
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
                },
                files = ['blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'];

            return hasFiles(scheme, files);
        });

        it('must detect mod dir of elem in level', function () {
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
                },
                dirs = ['blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'];

            return hasDirs(scheme, dirs);
        });

        it('must detect block files in levels', function () {
            var scheme = {
                    'level-1': {
                        block: {
                            'block.ext': ''
                        }
                    },
                    'level-2': {
                        block: {
                            'block.ext': ''
                        }
                    }
                },
                files = [
                    'level-1/block/block.ext',
                    'level-2/block/block.ext'
                ];

            return hasFiles(scheme, files);
        });

        it('must detect block dirs in levels', function () {
            var scheme = {
                    'level-1': {
                        block: {
                            'block.ext': {}
                        }
                    },
                    'level-2': {
                        block: {
                            'block.ext': {}
                        }
                    }
                },
                dirs = [
                    'level-1/block/block.ext',
                    'level-2/block/block.ext'
                ];

            return hasDirs(scheme, dirs);
        });

        it('must handle full paths', function () {
            mockFs({
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                },
                bundle: {}
            });

            var bundle = new TestNode('bundle'),
                levelDirname = path.resolve('blocks');

            return bundle.runTech(Tech, { levels: [levelDirname] })
                .then(function (levels) {
                    var files = getEntityFiles(levels, 'block', 'files');

                    files[0].name.must.be('block.ext');
                    files.must.have.length(1);
                });
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

function getEntityFiles(levels, entity, filetype) {
    var notation = naming.parse(entity);

    if (notation.elem) {
        return levels.getElemEntities(notation.block, notation.elem, notation.modName, notation.modVal)[filetype];
    } else {
        return levels.getBlockEntities(notation.block, notation.modName, notation.modVal)[filetype];
    }
}

function has(fsScheme, filenames, filetype) {
    return getLevels(fsScheme)
        .then(function (levels) {
            filenames.forEach(function (filename, i) {
                var basename = path.basename(filename).split('.')[0],
                    fullname = path.resolve(filename),
                    files = getEntityFiles(levels, basename, filetype);

                files.must.have.length(filenames.length);
                files[i].fullname.must.be(fullname);
            });
        });
}

function hasFiles(fsScheme, filenames) {
    return has(fsScheme, filenames, 'files');
}

function hasDirs(fsScheme, filenames) {
    return has(fsScheme, filenames, 'dirs');
}
