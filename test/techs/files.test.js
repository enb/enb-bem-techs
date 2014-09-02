var path = require('path'),
    FileSystem = require('enb/lib/test/mocks/test-file-system'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    filesTech = require('../../techs/files');

describe('techs', function () {
    describe('files', function () {
        var fileSystem,
            bundle,
            fileLevels,
            dirLevels,
            suffixLevels;

        beforeEach(function () {
            fileSystem = new FileSystem([{
                directory: 'files.blocks',
                items: [
                    {
                        directory: 'block',
                        items: [
                            { file: 'block' },
                            { directory: '_mod', items: [{ file: 'block_mod' }] },
                            { directory: '_modName', items: [{ file: 'block_modName_modVal' }] },
                            { directory: '__elem',
                                items: [
                                    { file: 'block__elem' },
                                    { directory: '_mod', items: [ { file: 'block__elem_mod' }] },
                                    { directory: '_modName', items: [{ file: 'block__elem_modName_modVal' }] }
                                ]
                            }
                        ]
                    }
                ]
            }, {
                directory: 'dirs.blocks',
                items: [
                    {
                        directory: 'block',
                        items: [
                            { directory: 'block.dir', items: [] },
                            { directory: '_mod', items: [{ directory: 'block_mod.dir', items: [] }] },
                            { directory: '_modName', items: [{ directory: 'block_modName_modVal.dir', items: [] }] },
                            { directory: '__elem',
                                items: [
                                    { directory: 'block__elem.dir', items: [] },
                                    { directory: '_mod', items: [
                                        { directory: 'block__elem_mod.dir', items: [] }
                                    ] },
                                    { directory: '_modName', items: [
                                        { directory: 'block__elem_modName_modVal.dir', items: [] }
                                    ] }
                                ]
                            }
                        ]
                    }
                ]
            }, {
                directory: 'suffix.blocks',
                items: [
                    {
                        directory: 'A',
                        items: [
                            { file: 'A.a' },
                            { file: 'A.b' },
                            { directory: 'A.a-dir', items: [] },
                            { directory: 'A.b-dir', items: [] }
                        ]
                    },
                    {
                        directory: 'B',
                        items: [
                            { file: 'B.a' },
                            { file: 'B.b' },
                            { directory: 'B.a-dir', items: [] },
                            { directory: 'B.b-dir', items: [] }
                        ]
                    }
                ]
            }, {
                directory: 'bundle', items: []
            }]);

            fileSystem.setup();

            bundle = new TestNode('bundle');

            fileLevels = [path.join(fileSystem._root, 'files.blocks')];
            dirLevels = [path.join(fileSystem._root, 'dirs.blocks')];
            suffixLevels = [path.join(fileSystem._root, 'suffix.blocks')];
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must get block file by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.bemdecl.js', [{ name: 'block' }]);

                    return bundle.runTechAndGetResults(filesTech, {
                        depsFile: '?.bemdecl.js',
                        depsFormat: 'bemdecl.js'
                    });
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block')[0],
                        filename = path.join(fileLevels[0], 'block', 'block');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block')[0],
                        filename = path.join(fileLevels[0], 'block', 'block');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get boolean mod of block file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block_mod')[0],
                        filename = path.join(fileLevels[0], 'block', '_mod', 'block_mod');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block mod file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block_modName_modVal')[0],
                        filename = path.join(fileLevels[0], 'block', '_modName', 'block_modName_modVal');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get elem file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block__elem')[0],
                        filename = path.join(fileLevels[0], 'block', '__elem', 'block__elem');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get boolean mod of elem file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block__elem_mod')[0],
                        filename = path.join(fileLevels[0], 'block', '__elem', '_mod', 'block__elem_mod');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get elem mod file by deps', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        file = files.getByName('block__elem_modName_modVal')[0],
                        filename = path.join(fileLevels[0], 'block', '__elem',
                        '_modName', 'block__elem_modName_modVal');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('block.dir')[0],
                        dirname = path.join(dirLevels[0], 'block', 'block.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get boolean mod of block dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('block_mod.dir')[0],
                        dirname = path.join(dirLevels[0], 'block', '_mod', 'block_mod.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get block mod dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('block_modName_modVal.dir')[0],
                        dirname = path.join(dirLevels[0], 'block', '_modName', 'block_modName_modVal.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get elem dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('block__elem.dir')[0],
                        dirname = path.join(dirLevels[0], 'block', '__elem', 'block__elem.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get boolean mod of elem dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('block__elem_mod.dir')[0],
                        dirname = path.join(dirLevels[0], 'block', '__elem', '_mod', 'block__elem_mod.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get elem mod dir by deps', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        dir = dirs.getByName('block__elem_modName_modVal.dir')[0],
                        dirname = path.join(dirLevels[0], 'block', '__elem',
                        '_modName', 'block__elem_modName_modVal.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get block file with suffix by deps', function (done) {
            bundle.runTech(levelsTech, { levels: suffixLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'A' }, { block: 'B' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'],
                        aFiles = files.getBySuffix('a'),
                        bFiles = files.getBySuffix('b'),
                        filenameAa = path.join(suffixLevels[0], 'A', 'A.a'),
                        filenameBa = path.join(suffixLevels[0], 'B', 'B.a'),
                        filenameAb = path.join(suffixLevels[0], 'A', 'A.b'),
                        filenameBb = path.join(suffixLevels[0], 'B', 'B.b');

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
                    bundle.provideTechData('?.deps.js', [{ block: 'A' }, { block: 'B' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'],
                        aFiles = dirs.getBySuffix('a-dir'),
                        bFiles = dirs.getBySuffix('b-dir'),
                        filenameAa = path.join(suffixLevels[0], 'A', 'A.a-dir'),
                        filenameBa = path.join(suffixLevels[0], 'B', 'B.a-dir'),
                        filenameAb = path.join(suffixLevels[0], 'A', 'A.b-dir'),
                        filenameBb = path.join(suffixLevels[0], 'B', 'B.b-dir');

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
                    bundle.provideTechData('?.deps.js', [
                        { block: 'block', mod: 'mod' },
                        { block: 'block', mod: 'mod', val: true }
                    ]);

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
