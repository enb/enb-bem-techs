var path = require('path'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files'),
    cwd = process.cwd();

describe('techs', function () {
    describe('files', function () {
        var bundle,
            fileLevels,
            dirLevels,
            suffixLevels;

        beforeEach(function () {
            mockFs({
                'files.blocks': {
                    'fully-block': {
                        'fully-block': '',
                        '_bool-mod': {
                            'fully-block_bool-mod': ''
                        },
                        '_mod-name': {
                            'fully-block_mod-name_mod-val': ''
                        },
                        __elem: {
                            'fully-block__elem': '',
                            '_bool-mod': {
                                'fully-block__elem_bool-mod': ''
                            },
                            '_mod-name': {
                                'fully-block__elem_mod-name_mod-val': ''
                            }
                        }
                    }
                },
                'dirs.blocks': {
                    'fully-block': {
                        'fully-block.dir': {},
                        '_bool-mod': {
                            'fully-block_bool-mod.dir': {}
                        },
                        '_mod-name': {
                            'fully-block_mod-name_mod-val.dir': {}
                        },
                        __elem: {
                            'fully-block__elem.dir': {},
                            '_bool-mod': {
                                'fully-block__elem_bool-mod.dir': {}
                            },
                            '_mod-name': {
                                'fully-block__elem_mod-name_mod-val.dir': {}
                            }
                        }
                    }
                },
                'suffix.blocks': {
                    A: {
                        'A.a': '',
                        'A.b': '',
                        'A.a-dir': {},
                        'A.b-dir': {}
                    },
                    B: {
                        'B.a': '',
                        'B.b': '',
                        'B.a-dir': {},
                        'B.b-dir': {}
                    }
                },
                bundle: {}
            });

            bundle = new TestNode('bundle');

            fileLevels = ['files.blocks'];
            dirLevels = ['dirs.blocks'];
            suffixLevels = ['suffix.blocks'];
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must get block file by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.bemdecl.js', { blocks: [{ name: 'fully-block' }] });

                    return bundle.runTechAndGetResults(filesTech, {
                        depsFile: '?.bemdecl.js'
                    });
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('fully-block')[0],
                        filename = path.join(cwd, fileLevels[0], 'fully-block', 'fully-block');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{ block: 'fully-block' }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('fully-block')[0],
                        filename = path.join(cwd, fileLevels[0], 'fully-block', 'fully-block');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get boolean mod of block file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{ block: 'fully-block',
                        mod: 'bool-mod', val: true }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('fully-block_bool-mod')[0],
                        filename = path.join(cwd, fileLevels[0], 'fully-block', '_bool-mod', 'fully-block_bool-mod');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block mod file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{
                        block: 'fully-block',
                        mod: 'mod-name',
                        val: 'mod-val'
                    }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('fully-block_mod-name_mod-val')[0],
                        filename = path.join(cwd, fileLevels[0], 'fully-block',
                            '_mod-name', 'fully-block_mod-name_mod-val');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get elem file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{ block: 'fully-block', elem: 'elem' }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('fully-block__elem')[0],
                        filename = path.join(cwd, fileLevels[0], 'fully-block', '__elem', 'fully-block__elem');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get boolean mod of elem file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', {
                        deps: [{ block: 'fully-block', elem: 'elem', mod: 'bool-mod', val: true }]
                    });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('fully-block__elem_bool-mod')[0],
                        filename = path.join(cwd, fileLevels[0], 'fully-block', '__elem',
                            '_bool-mod', 'fully-block__elem_bool-mod');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get elem mod file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', {
                        deps: [{ block: 'fully-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }]
                    });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('fully-block__elem_mod-name_mod-val')[0],
                        filename = path.join(cwd, fileLevels[0], 'fully-block', '__elem',
                        '_mod-name', 'fully-block__elem_mod-name_mod-val');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{ block: 'fully-block' }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('fully-block.dir')[0],
                        dirname = path.join(cwd, dirLevels[0], 'fully-block', 'fully-block.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get boolean mod of block dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{ block: 'fully-block',
                        mod: 'bool-mod', val: true }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('fully-block_bool-mod.dir')[0],
                        dirname = path.join(cwd, dirLevels[0], 'fully-block', '_bool-mod', 'fully-block_bool-mod.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get block mod dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', {
                        deps: [{ block: 'fully-block', mod: 'mod-name', val: 'mod-val' }]
                    });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('fully-block_mod-name_mod-val.dir')[0],
                        dirname = path.join(cwd, dirLevels[0], 'fully-block',
                            '_mod-name', 'fully-block_mod-name_mod-val.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get elem dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', {
                        deps: [{ block: 'fully-block', elem: 'elem' }]
                    });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('fully-block__elem.dir')[0],
                        dirname = path.join(cwd, dirLevels[0], 'fully-block', '__elem', 'fully-block__elem.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get boolean mod of elem dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', {
                        deps: [{ block: 'fully-block', elem: 'elem', mod: 'bool-mod', val: true }]
                    });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('fully-block__elem_bool-mod.dir')[0],
                        dirname = path.join(cwd, dirLevels[0], 'fully-block', '__elem',
                            '_bool-mod', 'fully-block__elem_bool-mod.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get elem mod dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', {
                        deps: [{ block: 'fully-block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }]
                    });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('fully-block__elem_mod-name_mod-val.dir')[0],
                        dirname = path.join(cwd, dirLevels[0], 'fully-block', '__elem',
                        '_mod-name', 'fully-block__elem_mod-name_mod-val.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get block file with suffix by deps', function (done) {
            bundle.runTech(levelsTech, { levels: suffixLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{ block: 'A' }, { block: 'B' }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        aFiles = files.getBySuffix('a'),
                        bFiles = files.getBySuffix('b'),
                        filenameAa = path.join(cwd, suffixLevels[0], 'A', 'A.a'),
                        filenameBa = path.join(cwd, suffixLevels[0], 'B', 'B.a'),
                        filenameAb = path.join(cwd, suffixLevels[0], 'A', 'A.b'),
                        filenameBb = path.join(cwd, suffixLevels[0], 'B', 'B.b');

                    aFiles[0].fullname.must.be(filenameAa);
                    aFiles[1].fullname.must.be(filenameBa);

                    bFiles[0].fullname.must.be(filenameAb);
                    bFiles[1].fullname.must.be(filenameBb);
                })
                .then(done, done);
        });

        it('must get block dir with suffix by deps', function (done) {
            bundle.runTech(levelsTech, { levels: suffixLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', { deps: [{ block: 'A' }, { block: 'B' }] });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        aFiles = dirs.getBySuffix('a-dir'),
                        bFiles = dirs.getBySuffix('b-dir'),
                        filenameAa = path.join(cwd, suffixLevels[0], 'A', 'A.a-dir'),
                        filenameBa = path.join(cwd, suffixLevels[0], 'B', 'B.a-dir'),
                        filenameAb = path.join(cwd, suffixLevels[0], 'A', 'A.b-dir'),
                        filenameBb = path.join(cwd, suffixLevels[0], 'B', 'B.b-dir');

                    aFiles[0].fullname.must.be(filenameAa);
                    aFiles[1].fullname.must.be(filenameBa);

                    bFiles[0].fullname.must.be(filenameAb);
                    bFiles[1].fullname.must.be(filenameBb);
                })
                .then(done, done);
        });

        it('must not add a few duplicate files', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', {
                        deps: [
                            { block: 'fully-block', mod: 'bool-mod' },
                            { block: 'fully-block', mod: 'bool-mod', val: true }
                        ]
                    });

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];

                    files.items.length.must.be(1);
                })
                .then(done, done);
        });
    });
});
