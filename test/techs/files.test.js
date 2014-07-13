var path = require('path');
var FileSystem = require('enb/lib/test/mocks/test-file-system');
var TestNode = require('enb/lib/test/mocks/test-node');
var levelsTech = require('../../techs/levels');
var filesTech = require('../../techs/files');

describe('techs', function () {
    describe('files', function () {
        var fileSystem;
        var bundle;
        var fileLevels;
        var dirLevels;
        var suffixLevels;

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
                                    { directory: '_modName', items: [{ file: 'block__elem_modName_modVal'}] }
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
                                    ]},
                                    { directory: '_modName', items: [
                                        { directory: 'block__elem_modName_modVal.dir', items: [] }
                                    ]}
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
                    bundle.provideTechData('?.deps.js', [{ block: 'block' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];
                    var file = files.getByName('block')[0];
                    var filename = path.join(fileLevels[0], 'block', 'block');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get boolean mod of block file by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];
                    var file = files.getByName('block_mod')[0];
                    var filename = path.join(fileLevels[0], 'block', '_mod', 'block_mod');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block mod file by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];
                    var file = files.getByName('block_modName_modVal')[0];
                    var filename = path.join(fileLevels[0], 'block', '_modName', 'block_modName_modVal');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get elem file by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];
                    var file = files.getByName('block__elem')[0];
                    var filename = path.join(fileLevels[0], 'block', '__elem', 'block__elem');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get boolean mod of elem file by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];
                    var file = files.getByName('block__elem_mod')[0];
                    var filename = path.join(fileLevels[0], 'block', '__elem', '_mod', 'block__elem_mod');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get elem mod file by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: fileLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];
                    var file = files.getByName('block__elem_modName_modVal')[0];
                    var filename = path.join(fileLevels[0], 'block', '__elem',
                        '_modName', 'block__elem_modName_modVal');

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must get block dir by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'];
                    var dir = dirs.getByName('block.dir')[0];
                    var dirname = path.join(dirLevels[0], 'block', 'block.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get boolean mod of block dir by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'];
                    var dir = dirs.getByName('block_mod.dir')[0];
                    var dirname = path.join(dirLevels[0], 'block', '_mod', 'block_mod.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get block mod dir by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'];
                    var dir = dirs.getByName('block_modName_modVal.dir')[0];
                    var dirname = path.join(dirLevels[0], 'block', '_modName', 'block_modName_modVal.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get elem dir by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'];
                    var dir = dirs.getByName('block__elem.dir')[0];
                    var dirname = path.join(dirLevels[0], 'block', '__elem', 'block__elem.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get boolean mod of elem dir by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'mod', val: true }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'];
                    var dir = dirs.getByName('block__elem_mod.dir')[0];
                    var dirname = path.join(dirLevels[0], 'block', '__elem', '_mod', 'block__elem_mod.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get elem mod dir by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: dirLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'block', elem: 'elem',
                        mod: 'modName', val: 'modVal' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'];
                    var dir = dirs.getByName('block__elem_modName_modVal.dir')[0];
                    var dirname = path.join(dirLevels[0], 'block', '__elem',
                        '_modName', 'block__elem_modName_modVal.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must get block file with suffix by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: suffixLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'A' }, { block: 'B' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var files = result['bundle.files'];
                    var aFiles = files.getBySuffix('a');
                    var bFiles = files.getBySuffix('b');
                    var filenameAa = path.join(suffixLevels[0], 'A', 'A.a');
                    var filenameBa = path.join(suffixLevels[0], 'B', 'B.a');
                    var filenameAb = path.join(suffixLevels[0], 'A', 'A.b');
                    var filenameBb = path.join(suffixLevels[0], 'B', 'B.b');

                    aFiles[0].fullname.must.be(filenameAa);
                    aFiles[1].fullname.must.be(filenameBa);

                    bFiles[0].fullname.must.be(filenameAb);
                    bFiles[1].fullname.must.be(filenameBb);
                })
                .then(done, done);
        });

        it('must get block dir with suffix by bemdecl', function (done) {
            bundle.runTech(levelsTech, { levels: suffixLevels })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);
                    bundle.provideTechData('?.deps.js', [{ block: 'A' }, { block: 'B' }]);

                    return bundle.runTechAndGetResults(filesTech);
                })
                .then(function (result) {
                    var dirs = result['bundle.dirs'];
                    var aFiles = dirs.getBySuffix('a-dir');
                    var bFiles = dirs.getBySuffix('b-dir');
                    var filenameAa = path.join(suffixLevels[0], 'A', 'A.a-dir');
                    var filenameBa = path.join(suffixLevels[0], 'B', 'B.a-dir');
                    var filenameAb = path.join(suffixLevels[0], 'A', 'A.b-dir');
                    var filenameBb = path.join(suffixLevels[0], 'B', 'B.b-dir');

                    aFiles[0].fullname.must.be(filenameAa);
                    aFiles[1].fullname.must.be(filenameBa);

                    bFiles[0].fullname.must.be(filenameAb);
                    bFiles[1].fullname.must.be(filenameBb);
                })
                .then(done, done);
        });
    });
});
