'use strict';

const path = require('path');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const techs = require('../..');
const levelsTech = techs.levels;
const filesTech = techs.files;

describe('techs: files', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must get block file by bemdecl', () => {
        mockFs({
            blocks: {
                block: {
                    'block.ext': ''
                }
            },
            bundle: {}
        });

        const bundle = new TestNode('bundle');
        const bemdecl = { blocks: [{ name: 'block' }] };

        return bundle.runTech(levelsTech, { levels: ['blocks'] })
            .then(levels => {
                bundle.provideTechData('?.levels', levels);
                bundle.provideTechData('?.bemdecl.js', bemdecl);

                return bundle.runTechAndGetResults(filesTech, {
                    depsFile: '?.bemdecl.js'
                });
            })
            .then(result => {
                const files = result['bundle.files'];
                const file = files.getByName('block.ext')[0];

                file.name.must.be('block.ext');
            });
    });

    it('must support deps as array', () => {
        mockFs({
            blocks: {
                block: {
                    'block.ext': ''
                }
            },
            bundle: {}
        });

        const bundle = new TestNode('bundle');
        const deps = [{ block: 'block' }];

        return bundle.runTech(levelsTech, { levels: ['blocks'] })
            .then(levels => {
                bundle.provideTechData('?.levels', levels);
                bundle.provideTechData('?.deps.js', deps);

                return bundle.runTechAndGetResults(filesTech);
            })
            .then(result => {
                const files = result['bundle.files'];
                const file = files.getByName('block.ext')[0];

                file.name.must.be('block.ext');
            });
    });

    it('must get files from levels', () => {
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

        const deps = [{ block: 'block' }];

        const files = [
            'level-1/block/block.ext',
            'level-2/block/block.ext'
        ];

        return hasFiles(scheme, deps, files);
    });

    describe('duplicates', () => {
        it('must add same file only once', () => {
            const scheme = {
                level: {
                    block: {
                        'block.ext': ''
                    }
                }
            };

            const levels = ['level', 'level'];
            const deps = [{ block: 'block' }];

            const files = [
                'level/block/block.ext'
            ];

            return hasFiles(scheme, deps, files, levels);
        });

        it('must add files only once if level nested in another level', () => {
            const scheme = {
                'level-1': {
                    'block-1': {
                        'block-1.ext': ''
                    },
                    'level-2': {
                        'block-2': {
                            'block-2.ext': ''
                        }
                    }
                }
            };

            const levels = ['level-1', 'level-1/level-2'];
            const deps = [{ block: 'block-1' }, { block: 'block-2' }];

            const files = [
                'level-1/block-1/block-1.ext',
                'level-1/level-2/block-2/block-2.ext'
            ];

            return hasFiles(scheme, deps, files, levels);
        });
    });

    describe('order', () => {
        it('must keep order by extensions', () => {
            mockFs({
                blocks: {
                    block: {
                        'block.ext-1': '',
                        'block.ext-2': ''
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');

            const deps = [
                { block: 'block' }
            ];

            const files = [
                'block.ext-2',
                'block.ext-1'
            ];

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(result => {
                    const FileList = result['bundle.files'];
                    const filenames = FileList.getBySuffix(['ext-2', 'ext-1']).map(fileInfo => fileInfo.name);

                    filenames.must.eql(files);
                });
        });

        it('must keep order between different entities', () => {
            mockFs({
                blocks: {
                    'block-1': {
                        'block-1.ext': ''
                    },
                    'block-2': {
                        'block-2.ext': ''
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');

            const deps = [
                { block: 'block-1' },
                { block: 'block-2' }
            ];

            const files = [
                'block-1.ext',
                'block-2.ext'
            ];

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(result => {
                const FileList = result['bundle.files'];
                const filenames = FileList.getBySuffix(['ext']).map(fileInfo => fileInfo.name);

                filenames.must.eql(files);
            });
        });

        it('must keep order between different entities by extensions', () => {
            mockFs({
                blocks: {
                    'block-1': {
                        'block-1.ext-1': '',
                        'block-1.ext-2': ''
                    },
                    'block-2': {
                        'block-2.ext-1': '',
                        'block-2.ext-2': ''
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');

            const deps = [
                { block: 'block-1' },
                { block: 'block-2' }
            ];

            const files = [
                'block-1.ext-2',
                'block-1.ext-1',
                'block-2.ext-2',
                'block-2.ext-1'
            ];

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(result => {
                    const FileList = result['bundle.files'];
                    const filenames = FileList.getBySuffix(['ext-2', 'ext-1']).map(fileInfo => fileInfo.name);

                    filenames.must.eql(files);
                });
        });

        it('must keep order by levels', () => {
            mockFs({
                'level-1': {
                    block: {
                        'block.ext': ''
                    }
                },
                'level-2': {
                    block: {
                        'block.ext': ''
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');
            const root = bundle.getRootDir();

            const deps = [
                { block: 'block' }
            ];

            const files = [
                'level-1:block.ext',
                'level-2:block.ext'
            ];

            return bundle.runTech(levelsTech, { levels: ['level-1', 'level-2'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(result => {
                    const FileList = result['bundle.files'];

                    const filenames = FileList.getBySuffix(['ext']).map(fileInfo => {
                        const level = path.dirname(path.dirname(path.relative(root, fileInfo.fullname)));

                        return `${level}:${fileInfo.name}`;
                    });

                    filenames.must.eql(files);
                });
        });

        it('must keep order between by levels and extensions', () => {
            mockFs({
                'level-1': {
                    block: {
                        'block.ext-1': '',
                        'block.ext-2': ''
                    }
                },
                'level-2': {
                    block: {
                        'block.ext-1': '',
                        'block.ext-2': ''
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');
            const root = bundle.getRootDir();

            const deps = [
                { block: 'block' }
            ];

            const files = [
                'level-1:block.ext-2',
                'level-1:block.ext-1',
                'level-2:block.ext-2',
                'level-2:block.ext-1'
            ];

            return bundle.runTech(levelsTech, { levels: ['level-1', 'level-2'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(result => {
                    const FileList = result['bundle.files'];

                    const filenames = FileList.getBySuffix(['ext-2', 'ext-1']).map(fileInfo => {
                        const level = path.dirname(path.dirname(path.relative(root, fileInfo.fullname)));

                        return `${level}:${fileInfo.name}`;
                    });

                    filenames.must.eql(files);
                });
        });

        it('must keep order between different entities by levels', () => {
            mockFs({
                'level-1': {
                    'block-1': {
                        'block-1.ext': ''
                    }
                },
                'level-2': {
                    'block-2': {
                        'block-2.ext': ''
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');
            const root = bundle.getRootDir();

            const deps = [
                { block: 'block-1' },
                { block: 'block-2' }
            ];

            const files = [
                'level-1:block-1.ext',
                'level-2:block-2.ext'
            ];

            return bundle.runTech(levelsTech, { levels: ['level-1', 'level-2'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(result => {
                    const FileList = result['bundle.files'];

                    const filenames = FileList.getBySuffix(['ext']).map(fileInfo => {
                        const level = path.dirname(path.dirname(path.relative(root, fileInfo.fullname)));

                        return `${level}:${fileInfo.name}`;
                    });

                    filenames.must.eql(files);
                });
        });

        it('must keep order between different entities by levels and extensions', () => {
            mockFs({
                'level-1': {
                    'block-1': {
                        'block-1.ext-1': '',
                        'block-1.ext-2': ''
                    },
                    'block-2': {
                        'block-2.ext-1': '',
                        'block-2.ext-2': ''
                    }
                },
                'level-2': {
                    'block-1': {
                        'block-1.ext-1': '',
                        'block-1.ext-2': ''
                    },
                    'block-2': {
                        'block-2.ext-1': '',
                        'block-2.ext-2': ''
                    }
                },
                bundle: {}
            });

            const bundle = new TestNode('bundle');
            const root = bundle.getRootDir();

            const deps = [
                { block: 'block-1' },
                { block: 'block-2' }
            ];

            const files = [
                'level-1:block-1.ext-2',
                'level-1:block-1.ext-1',
                'level-2:block-1.ext-2',
                'level-2:block-1.ext-1',
                'level-1:block-2.ext-2',
                'level-1:block-2.ext-1',
                'level-2:block-2.ext-2',
                'level-2:block-2.ext-1'
            ];

            return bundle.runTech(levelsTech, { levels: ['level-1', 'level-2'] })
                .then(levels => {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(result => {
                    const FileList = result['bundle.files'];

                    const filenames = FileList.getBySuffix(['ext-2', 'ext-1']).map(fileInfo => {
                        const level = path.dirname(path.dirname(path.relative(root, fileInfo.fullname)));

                        return `${level}:${fileInfo.name}`;
                    });

                    filenames.must.eql(files);
                });
        });
    });

    describe('bem entities', () => {
        it('must get block file by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                }
            };

            const deps = [{ block: 'block' }];
            const files = ['blocks/block/block.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get boolean mod of block file by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        '_bool-mod': {
                            'block_bool-mod.ext': ''
                        }
                    }
                }
            };

            const deps = [{ block: 'block', mod: 'bool-mod', val: true }];
            const files = ['blocks/block/_bool-mod/block_bool-mod.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get block mod file by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        '_mod-name': {
                            'block_mod-name_mod-val.ext': ''
                        }
                    }
                }
            };

            const deps = [{
                block: 'block',
                mod: 'mod-name',
                val: 'mod-val'
            }];

            const files = ['blocks/block/_mod-name/block_mod-name_mod-val.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get elem file by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            'block__elem-name.ext': ''
                        }
                    }
                }
            };

            const deps = [{ block: 'block', elem: 'elem-name' }];
            const files = ['blocks/block/__elem-name/block__elem-name.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get boolean mod of elem file by deps', () => {
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

            const deps = [{ block: 'block', elem: 'elem-name', mod: 'bool-mod', val: true }];
            const files = ['blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get elem mod file by deps', () => {
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

            const deps = [{ block: 'block', elem: 'elem-name', mod: 'mod-name', val: 'mod-val' }];
            const files = ['blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get block dir by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        'block.ext': {}
                    }
                }
            };

            const deps = [{ block: 'block' }];
            const files = ['blocks/block/block.ext'];

            return hasDirs(scheme, deps, files);
        });

        it('must get boolean mod of block dir by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        '_bool-mod': {
                            'block_bool-mod.ext': {}
                        }
                    }
                }
            };

            const deps = [{ block: 'block', mod: 'bool-mod', val: true }];
            const dirs = ['blocks/block/_bool-mod/block_bool-mod.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get block mod dir by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        '_mod-name': {
                            'block_mod-name_mod-val.ext': {}
                        }
                    }
                }
            };

            const deps = [{
                block: 'block',
                mod: 'mod-name',
                val: 'mod-val'
            }];

            const dirs = ['blocks/block/_mod-name/block_mod-name_mod-val.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get elem dir by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            'block__elem-name.ext': {}
                        }
                    }
                }
            };

            const deps = [{ block: 'block', elem: 'elem-name' }];
            const dirs = ['blocks/block/__elem-name/block__elem-name.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get boolean mod of elem dir by deps', () => {
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

            const deps = [{ block: 'block', elem: 'elem-name', mod: 'bool-mod', val: true }];
            const dirs = ['blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get elem mod dir by deps', () => {
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

            const deps = [{ block: 'block', elem: 'elem-name', mod: 'mod-name', val: 'mod-val' }];
            const dirs = ['blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get boolean mod & key-val mod by deps', () => {
            const scheme = {
                blocks: {
                    block: {
                        '_mod-name': {
                            'block_mod-name.ext': '',
                            'block_mod-name_mod-val.ext': ''
                        }
                    }
                }
            };

            const deps = [
                { block: 'block', mod: 'mod-name' },
                { block: 'block', mod: 'mod-name', val: 'mod-val' }
            ];

            const files = [
                'blocks/block/_mod-name/block_mod-name.ext',
                'blocks/block/_mod-name/block_mod-name_mod-val.ext'
            ];

            return hasFiles(scheme, deps, files);
        });
    });
});

function getEntityFiles(fsScheme, deps, filetype, levelPaths) {
    levelPaths = levelPaths || Object.keys(fsScheme);

    fsScheme['bundle'] = {};

    mockFs(fsScheme);

    const bundle = new TestNode('bundle');

    return bundle.runTech(levelsTech, { levels: levelPaths })
        .then(levels => {
            bundle.provideTechData('?.levels', levels);
            bundle.provideTechData('?.deps.js', { deps });

            return bundle.runTechAndGetResults(filesTech);
        })
        .then(result => result[`bundle.${filetype}`]);
}

function has(fsScheme, deps, filenames, filetype, levels) {
    return getEntityFiles(fsScheme, deps, filetype, levels)
        .then(files => {
            files.items.must.have.length(filenames.length);

            filenames.forEach((filename, i) => {
                const fullname = path.resolve(filename);

                files.items[i].fullname.must.be(fullname);
            });
        });
}

function hasFiles(fsScheme, deps, filenames, levels) {
    return has(fsScheme, deps, filenames, 'files', levels);
}

function hasDirs(fsScheme, deps, filenames, levels) {
    return has(fsScheme, deps, filenames, 'dirs', levels);
}
