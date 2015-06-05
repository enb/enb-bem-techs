var path = require('path'),
    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files');

describe('techs', function () {
    describe('files', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must get block file by bemdecl', function () {
            mockFs({
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                },
                bundle: {}
            });

            var bundle = new TestNode('bundle'),
                bemdecl = { blocks: [{ name: 'block' }] };

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.bemdecl.js', bemdecl);

                    return bundle.runTechAndGetResults(filesTech, {
                        depsFile: '?.bemdecl.js'
                    });
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block.ext')[0];

                    file.name.must.be('block.ext');
                });
        });

        it('must support deps as array', function () {
            mockFs({
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                },
                bundle: {}
            });

            var bundle = new TestNode('bundle'),
                deps = [{ block: 'block' }];

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block.ext')[0];

                    file.name.must.be('block.ext');
                });
        });

        it('must keep order of entities', function () {
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

            var bundle = new TestNode('bundle'),
                deps = [
                    { block: 'block-1' },
                    { block: 'block-2' }
                ],
                files = [
                    'block-1.ext-1',
                    'block-1.ext-2',
                    'block-2.ext-1',
                    'block-2.ext-2'
                ];

            return bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', deps);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var FileList = result['bundle.files'],
                        filenames = FileList.getBySuffix(['ext-1', 'ext-2']).map(function (fileInfo) {
                            return fileInfo.name;
                        });

                    filenames.must.eql(files);
                });
        });

        it('must get block file by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.ext': ''
                        }
                    }
                },
                deps = [{ block: 'block' }],
                files = ['blocks/block/block.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get boolean mod of block file by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_bool-mod': {
                                'block_bool-mod.ext': ''
                            }
                        }
                    }
                },
                deps = [{ block: 'block', mod: 'bool-mod', val: true }],
                files = ['blocks/block/_bool-mod/block_bool-mod.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get block mod file by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_mod-name': {
                                'block_mod-name_mod-val.ext': ''
                            }
                        }
                    }
                },
                deps = [{
                    block: 'block',
                    mod: 'mod-name',
                    val: 'mod-val'
                }],
                files = ['blocks/block/_mod-name/block_mod-name_mod-val.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get elem file by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '__elem-name': {
                                'block__elem-name.ext': ''
                            }
                        }
                    }
                },
                deps = [{ block: 'block', elem: 'elem-name' }],
                files = ['blocks/block/__elem-name/block__elem-name.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get boolean mod of elem file by deps', function () {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'bool-mod', val: true }],
                files = ['blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get elem mod file by deps', function () {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'mod-name', val: 'mod-val' }],
                files = ['blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'];

            return hasFiles(scheme, deps, files);
        });

        it('must get block dir by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            'block.ext': {}
                        }
                    }
                },
                deps = [{ block: 'block' }],
                files = ['blocks/block/block.ext'];

            return hasDirs(scheme, deps, files);
        });

        it('must get boolean mod of block dir by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_bool-mod': {
                                'block_bool-mod.ext': {}
                            }
                        }
                    }
                },
                deps = [{ block: 'block', mod: 'bool-mod', val: true }],
                dirs = ['blocks/block/_bool-mod/block_bool-mod.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get block mod dir by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_mod-name': {
                                'block_mod-name_mod-val.ext': {}
                            }
                        }
                    }
                },
                deps = [{
                    block: 'block',
                    mod: 'mod-name',
                    val: 'mod-val'
                }],
                dirs = ['blocks/block/_mod-name/block_mod-name_mod-val.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get elem dir by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '__elem-name': {
                                'block__elem-name.ext': {}
                            }
                        }
                    }
                },
                deps = [{ block: 'block', elem: 'elem-name' }],
                dirs = ['blocks/block/__elem-name/block__elem-name.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get boolean mod of elem dir by deps', function () {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'bool-mod', val: true }],
                dirs = ['blocks/block/__elem-name/_bool-mod/block__elem-name_bool-mod.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get elem mod dir by deps', function () {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'mod-name', val: 'mod-val' }],
                dirs = ['blocks/block/__elem-name/_mod-name/block__elem-name_mod-name_mod-val.ext'];

            return hasDirs(scheme, deps, dirs);
        });

        it('must get boolean mod & key-val mod by deps', function () {
            var scheme = {
                    blocks: {
                        block: {
                            '_mod-name': {
                                'block_mod-name.ext': '',
                                'block_mod-name_mod-val.ext': ''
                            }
                        }
                    }
                },
                deps = [
                    { block: 'block', mod: 'mod-name' },
                    { block: 'block', mod: 'mod-name', val: 'mod-val' }
                ],
                files = [
                    'blocks/block/_mod-name/block_mod-name.ext',
                    'blocks/block/_mod-name/block_mod-name_mod-val.ext'
                ];

            return hasFiles(scheme, deps, files);
        });

        it('must get files from levels', function () {
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
                deps = [{ block: 'block' }],
                files = [
                    'level-1/block/block.ext',
                    'level-2/block/block.ext'
                ];

            return hasFiles(scheme, deps, files);
        });
    });
});

function getEntityFiles(fsScheme, deps, filetype) {
    var levels = Object.keys(fsScheme);

    fsScheme['bundle'] = {};

    mockFs(fsScheme);

    var bundle = new TestNode('bundle');

    return bundle.runTech(levelsTech, { levels: levels })
        .then(function (levels) {
            bundle.provideTechData('?.levels', levels);
            bundle.provideTechData('?.deps.js', { deps: deps });

            return bundle.runTechAndGetResults(filesTech);
        })
        .then(function (result) {
            return result['bundle.' + filetype];
        });
}

function has(fsScheme, deps, filenames, filetype) {
    return getEntityFiles(fsScheme, deps, filetype)
        .then(function (files) {
            files.items.must.have.length(filenames.length);

            filenames.forEach(function (filename, i) {
                var fullname = path.resolve(filename);

                files.items[i].fullname.must.be(fullname);
            });
        });
}

function hasFiles(fsScheme, deps, filenames) {
    return has(fsScheme, deps, filenames, 'files');
}

function hasDirs(fsScheme, deps, filenames) {
    return has(fsScheme, deps, filenames, 'dirs');
}
