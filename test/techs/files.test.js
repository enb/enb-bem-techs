var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files');

describe('techs', function () {
    describe('files', function () {
        afterEach(function () {
            mockFs.restore();
        });

        it('must get block file by bemdecl', function (done) {
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

            bundle.runTech(levelsTech, { levels: ['blocks'] })
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
                })
                .then(done, done);
        });

        it('must get block file by deps', function (done) {
            var scheme = {
                    blocks: {
                        block: {
                            'block.ext': ''
                        }
                    }
                },
                deps = [{ block: 'block' }];

            hasFile(scheme, deps, 'block.ext', done);
        });

        it('must get boolean mod of block file by deps', function (done) {
            var scheme = {
                    blocks: {
                        block: {
                            '_bool-mod': {
                                'block_bool-mod.ext': ''
                            }
                        }
                    }
                },
                deps = [{ block: 'block', mod: 'bool-mod', val: true }];

            hasFile(scheme, deps, 'block_bool-mod.ext', done);
        });

        it('must get block mod file by deps', function (done) {
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
                }];

            hasFile(scheme, deps, 'block_mod-name_mod-val.ext', done);
        });

        it('must get elem file by deps', function (done) {
            var scheme = {
                    blocks: {
                        block: {
                            '__elem-name': {
                                'block__elem-name.ext': ''
                            }
                        }
                    }
                },
                deps = [{ block: 'block', elem: 'elem-name' }];

            hasFile(scheme, deps, 'block__elem-name.ext', done);
        });

        it('must get boolean mod of elem file by deps', function (done) {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'bool-mod', val: true }];

            hasFile(scheme, deps, 'block__elem-name_bool-mod.ext', done);
        });

        it('must get elem mod file by deps', function (done) {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'mod-name', val: 'mod-val' }];

            hasFile(scheme, deps, 'block__elem-name_mod-name_mod-val.ext', done);
        });

        it('must get block dir by deps', function (done) {
            var scheme = {
                    blocks: {
                        block: {
                            'block.ext': {}
                        }
                    }
                },
                deps = [{ block: 'block' }];

            hasDir(scheme, deps, 'block.ext', done);
        });

        it('must get boolean mod of block dir by deps', function (done) {
            var scheme = {
                    blocks: {
                        block: {
                            '_bool-mod': {
                                'block_bool-mod.ext': {}
                            }
                        }
                    }
                },
                deps = [{ block: 'block', mod: 'bool-mod', val: true }];

            hasDir(scheme, deps, 'block_bool-mod.ext', done);
        });

        it('must get block mod dir by deps', function (done) {
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
                }];

            hasDir(scheme, deps, 'block_mod-name_mod-val.ext', done);
        });

        it('must get elem dir by deps', function (done) {
            var scheme = {
                    blocks: {
                        block: {
                            '__elem-name': {
                                'block__elem-name.ext': {}
                            }
                        }
                    }
                },
                deps = [{ block: 'block', elem: 'elem-name' }];

            hasDir(scheme, deps, 'block__elem-name.ext', done);
        });

        it('must get boolean mod of elem dir by deps', function (done) {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'bool-mod', val: true }];

            hasDir(scheme, deps, 'block__elem-name_bool-mod.ext', done);
        });

        it('must get elem mod dir by deps', function (done) {
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
                deps = [{ block: 'block', elem: 'elem-name', mod: 'mod-name', val: 'mod-val' }];

            hasDir(scheme, deps, 'block__elem-name_mod-name_mod-val.ext', done);
        });
    });
});

function getEntityFiles(fsScheme, deps) {
    fsScheme['bundle'] = {};

    mockFs(fsScheme);

    var bundle = new TestNode('bundle');

    return bundle.runTech(levelsTech, { levels: ['blocks'] })
        .then(function (levels) {
            bundle.provideTechData('?.levels', levels);
            bundle.provideTechData('?.deps.js', { deps: deps });

            return bundle.runTechAndGetResults(filesTech);
        });
}

function getFiles(fsScheme, deps) {
    return getEntityFiles(fsScheme, deps)
        .then(function (result) {
            return result['bundle.files'];
        });
}

function getDirs(fsScheme, deps) {
    return getEntityFiles(fsScheme, deps)
        .then(function (result) {
            return result['bundle.dirs'];
        });
}

function hasFile(fsScheme, deps, filename, done) {
    return getFiles(fsScheme, deps)
        .then(function (files) {
            var file = files.getByName(filename)[0];

            file.name.must.be(filename);
        })
        .then(done, done);
}

function hasDir(fsScheme, deps, dirname, done) {
    return getDirs(fsScheme, deps)
        .then(function (files) {
            var dir = files.getByName(dirname)[0];

            dir.name.must.be(dirname);
        })
        .then(done, done);
}
