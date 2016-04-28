var path = require('path'),

    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    Tech = require('../utils/techs').levels;

describe('techs: levels', function () {
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
            expected = {
                block: [
                    {
                        entity: { block: 'block' },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/block.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: false
                    }
                ]
            };

        return assert(scheme, {
            levels: [path.resolve('blocks')],
            introspection: expected
        });
    });

    it('must detect block dir in level', function () {
        var scheme = {
                blocks: {
                    block: {
                        'block.ext': {}
                    }
                }
            },
            expected = {
                block: [
                    {
                        entity: { block: 'block' },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/block.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: true
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block_bool-mod': [
                    {
                        entity: { block: 'block', modName: 'bool-mod', modVal: true },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/_bool-mod/block_bool-mod.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: false
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block_bool-mod': [
                    {
                        entity: { block: 'block', modName: 'bool-mod', modVal: true },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/_bool-mod/block_bool-mod.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: true
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block_mod-name_mod-val': [
                    {
                        entity: { block: 'block', modName: 'mod-name', modVal: 'mod-val' },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/_mod-name/block_mod-name_mod-val.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: false
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block_mod-name_mod-val': [
                    {
                        entity: { block: 'block', modName: 'mod-name', modVal: 'mod-val' },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/_mod-name/block_mod-name_mod-val.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: true
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block__elem-name': [
                    {
                        entity: { block: 'block', elem: 'elem-name' },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/__elem-name/block__elem-name.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: false
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block__elem-name': [
                    {
                        entity: { block: 'block', elem: 'elem-name' },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/__elem-name/block__elem-name.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: true
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block__elem-name_bool-mod': [
                    {
                        entity: { block: 'block', elem: 'elem-name', modName: 'bool-mod', modVal: true },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: false
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block__elem-name_bool-mod': [
                    {
                        entity: { block: 'block', elem: 'elem-name', modName: 'bool-mod', modVal: true },
                        tech: 'ext',
                        path: path.resolve('./blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'),
                        level: path.resolve('./blocks'),
                        isDirectory: true
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block__elem-name_mod-name_mod-val': [
                    {
                        entity: { block: 'block', elem: 'elem-name', modName: 'mod-name', modVal: 'mod-val' },
                        tech: 'ext',
                        path: path.resolve(
                            './blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'
                        ),
                        level: path.resolve('./blocks'),
                        isDirectory: false
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                'block__elem-name_mod-name_mod-val': [
                    {
                        entity: { block: 'block', elem: 'elem-name', modName: 'mod-name', modVal: 'mod-val' },
                        tech: 'ext',
                        path: path.resolve(
                            './blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'
                        ),
                        level: path.resolve('./blocks'),
                        isDirectory: true
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('blocks')],
                introspection: expected
            });
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
            expected = {
                block: [
                    {
                        entity: { block: 'block' },
                        tech: 'ext',
                        path: path.resolve('./level-1/block/block.ext'),
                        level: path.resolve('./level-1'),
                        isDirectory: false
                    },
                    {
                        entity: { block: 'block' },
                        tech: 'ext',
                        path: path.resolve('./level-2/block/block.ext'),
                        level: path.resolve('./level-2'),
                        isDirectory: false
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('level-1'), path.resolve('level-2')],
                introspection: expected
            });
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
            expected = {
                block: [
                    {
                        entity: { block: 'block' },
                        tech: 'ext',
                        path: path.resolve('./level-1/block/block.ext'),
                        level: path.resolve('./level-1'),
                        isDirectory: true
                    },
                    {
                        entity: { block: 'block' },
                        tech: 'ext',
                        path: path.resolve('./level-2/block/block.ext'),
                        level: path.resolve('./level-2'),
                        isDirectory: true
                    }
                ]
            };

            return assert(scheme, {
                levels: [path.resolve('level-1'), path.resolve('level-2')],
                introspection: expected
            });
    });
});

function assert(fsScheme, expected) {
    var levels = Object.keys(fsScheme),
        bundle;

    fsScheme['bundle'] = {};
    mockFs(fsScheme);

    bundle = new TestNode('bundle');

    return bundle.runTech(Tech, { levels: levels })
        .then(function (data) {
            var actual = {
                levels: data._levels,
                introspection: mergeIntrospections(data._introspections)
            };

            actual.must.eql(expected);
        });
}

/**
  * Merges introspection from several levels.
  *
  * @param {object[]} introspections
  * @returns {object}
  */
function mergeIntrospections(introspections) {
    var result = {};

    introspections.forEach(function (introspection) {
        Object.keys(introspection).forEach(function (id) {
            var files = (introspection[id] || []).map(function (file) {
                delete file.mtime;

                return file;
            });

            result[id] = (result[id] || []).concat(files);
        });
    });

    return result;
}
