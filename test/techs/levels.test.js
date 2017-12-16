'use strict';

const path = require('path');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const Tech = require('../..').levels;

describe('techs: levels', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must detect block file in level', () => {
        const scheme = {
            blocks: {
                block: {
                    'block.ext': ''
                }
            }
        };

        const expected = {
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

    it('must support block with constructor name', () => {
        const scheme = {
            blocks: {
                constructor: {
                    'constructor.ext': ''
                }
            }
        };

        const expected = {
            constructor: [
                {
                    entity: { block: 'constructor' },
                    tech: 'ext',
                    path: path.resolve('./blocks/constructor/constructor.ext'),
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

    it('must detect block dir in level', () => {
        const scheme = {
            blocks: {
                block: {
                    'block.ext': {}
                }
            }
        };

        const expected = {
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

    it('must detect boolean mod file of block in level', () => {
        const scheme = {
            blocks: {
                block: {
                    '_bool-mod': {
                        'block_bool-mod.ext': ''
                    }
                }
            }
        };

        const expected = {
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

    it('must detect boolean mod dir of block in level', () => {
        const scheme = {
            blocks: {
                block: {
                    '_bool-mod': {
                        'block_bool-mod.ext': {}
                    }
                }
            }
        };

        const expected = {
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

    it('must detect mod file of block in level', () => {
        const scheme = {
            blocks: {
                block: {
                    '_mod-name': {
                        'block_mod-name_mod-val.ext': ''
                    }
                }
            }
        };

        const expected = {
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

    it('must detect mod dir of block in level', () => {
        const scheme = {
            blocks: {
                block: {
                    '_mod-name': {
                        'block_mod-name_mod-val.ext': {}
                    }
                }
            }
        };

        const expected = {
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

    it('must detect elem file of block in level', () => {
        const scheme = {
            blocks: {
                block: {
                    '__elem-name': {
                        'block__elem-name.ext': ''
                    }
                }
            }
        };

        const expected = {
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

    it('must detect elem dir of block in level', () => {
        const scheme = {
            blocks: {
                block: {
                    '__elem-name': {
                        'block__elem-name.ext': {}
                    }
                }
            }
        };

        const expected = {
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

    it('must detect boolean mod file of elem in level', () => {
        const scheme = {
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

        const expected = {
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

    it('must detect boolean mod dir of elem in level', () => {
        const scheme = {
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

        const expected = {
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

    it('must detect mod file of elem in level', () => {
        const scheme = {
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

        const expected = {
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

    it('must detect mod dir of elem in level', () => {
        const scheme = {
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

        const expected = {
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

    it('must detect block files in levels', () => {
        const scheme = {
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
        };

        const expected = {
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

    it('must detect block dirs in levels', () => {
        const scheme = {
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
        };

        const expected = {
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

    it('mtime must be number', () => {
        const fsScheme = {
            blocks: {
                block: {
                    'block.ext': ''
                }
            },
            bundle: {}
        };

        mockFs(fsScheme);

        const bundle = new TestNode('bundle');

        return bundle.runTech(Tech, { levels: ['blocks'] })
            .then(data => {
                data._introspections[0].block[0].mtime.must.be.number();
            });
    });
});

function assert(fsScheme, expected) {
    const levels = Object.keys(fsScheme);
    let bundle;

    fsScheme['bundle'] = {};
    mockFs(fsScheme);

    bundle = new TestNode('bundle');

    return bundle.runTech(Tech, { levels })
        .then(data => {
            const actual = {
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
    const result = {};

    introspections.forEach(introspection => {
        Object.keys(introspection).forEach(id => {
            const clearFiles = (introspection[id] || []).map(file => {
                delete file.mtime;

                return file;
            });

            const files = result.hasOwnProperty(id) ? result[id] : [];

            result[id] = files.concat(clearFiles);
        });
    });

    return result;
}
