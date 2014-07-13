var path = require('path');
var FileSystem = require('enb/lib/test/mocks/test-file-system');
var TestNode = require('enb/lib/test/mocks/test-node');
var LevelsTech = require('../../techs/levels');

describe('techs', function () {
    describe('levels', function () {
        var fileSystem;
        var bundle;
        var desktopBundle;
        var blocksDirname;
        var fullyBlockDirname;
        var commonLevel;
        var desktopLevel;
        var desktopLevels;

        beforeEach(function () {
            fileSystem = new FileSystem([
                {
                    directory: 'blocks',
                    items: [{
                        directory: 'fully-block',
                        items: [
                            { file: 'fully-block' },
                            { directory: 'fully-block.dir', items: [] },
                            { directory: '_bool-mod',
                                items: [
                                    { file: 'fully-block_bool-mod' },
                                    { directory: 'fully-block_bool-mod.dir', items: [] }
                                ]
                            },
                            { directory: '_modName',
                                items: [
                                    { file: 'fully-block_modName_modVal' },
                                    { directory: 'fully-block_modName_modVal.dir', items: [] }
                                ]
                            },
                            { directory: '__elem',
                                items: [
                                    { file: 'fully-block__elem' },
                                    { directory: 'fully-block__elem.dir', items: [] },
                                    { directory: '_bool-mod',
                                        items: [
                                            { file: 'fully-block__elem_bool-mod' },
                                            { directory: 'fully-block__elem_bool-mod.dir', items: [] }
                                        ]
                                    },
                                    { directory: '_modName',
                                        items: [
                                            { file: 'fully-block__elem_modName_modVal'},
                                            { directory: 'fully-block__elem_modName_modVal.dir', items: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }]
                },
                {
                    directory: 'common.blocks',
                    items: [{
                        directory: 'block-1',
                        items: [
                            { file: 'block-1' },
                            { directory: 'block-1.dir', items: [] }
                        ]
                    }]
                },
                {
                    directory: 'desktop.blocks',
                    items: [{
                        directory: 'block-1',
                        items: [
                            { file: 'block-1' },
                            { directory: 'block-1.dir', items: [] }
                        ]
                    }]
                },
                {
                    directory: 'bundle',
                    items: []
                },
                {
                    directory: 'desktop.bundle',
                    items: []
                }
            ]);
            fileSystem.setup();

            bundle = new TestNode('bundle');
            desktopBundle = new TestNode('desktop.bundle');

            blocksDirname = path.join(fileSystem._root, 'blocks');
            fullyBlockDirname = path.join(blocksDirname, 'fully-block');
            commonLevel = path.join(fileSystem._root, 'common.blocks');
            desktopLevel = path.join(fileSystem._root, 'desktop.blocks');
            desktopLevels = [commonLevel, desktopLevel];
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must detect block file in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block';
                    var file = levels.getBlockFiles('fully-block')[0];
                    var filename = path.join(fullyBlockDirname, name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect block dir in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block';
                    var dir = levels.getBlockEntities('fully-block').dirs[0];
                    var dirname = path.join(fullyBlockDirname, name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect boolean mod file of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_bool-mod';
                    var file = levels.getBlockFiles('fully-block', 'bool-mod', true)[0];
                    var filename = path.join(fullyBlockDirname, '_bool-mod', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect boolean mod dir of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_bool-mod';
                    var dir = levels.getBlockEntities('fully-block', 'bool-mod', true).dirs[0];
                    var dirname = path.join(fullyBlockDirname, '_bool-mod', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect mod file of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_modName_modVal';
                    var file = levels.getBlockFiles('fully-block', 'modName', 'modVal')[0];
                    var filename = path.join(fullyBlockDirname, '_modName', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect mod dir of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_modName_modVal';
                    var dir = levels.getBlockEntities('fully-block', 'modName', 'modVal').dirs[0];
                    var dirname = path.join(fullyBlockDirname, '_modName', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect elem file of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem';
                    var file = levels.getElemFiles('fully-block', 'elem')[0];
                    var filename = path.join(fullyBlockDirname, '__elem', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect elem dir of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem';
                    var dir = levels.getElemEntities('fully-block', 'elem').dirs[0];
                    var dirname = path.join(fullyBlockDirname, '__elem', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect boolean mod file of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_bool-mod';
                    var file = levels.getElemFiles('fully-block', 'elem', 'bool-mod', true)[0];
                    var filename = path.join(fullyBlockDirname, '__elem', '_bool-mod', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect boolean mod file of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_bool-mod';
                    var dir = levels.getElemEntities('fully-block', 'elem', 'bool-mod', true).dirs[0];
                    var dirname = path.join(fullyBlockDirname, '__elem', '_bool-mod', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect mod file of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_modName_modVal';
                    var file = levels.getElemFiles('fully-block', 'elem', 'modName', 'modVal')[0];
                    var filename = path.join(fullyBlockDirname, '__elem', '_modName', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect mod file of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_modName_modVal';
                    var dir = levels.getElemEntities('fully-block', 'elem', 'modName', 'modVal').dirs[0];
                    var dirname = path.join(fullyBlockDirname, '__elem', '_modName', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect block files in levels', function (done) {
            desktopBundle.runTech(LevelsTech, { levels: desktopLevels })
                .then(function (levels) {
                    var files = levels.getBlockFiles('block-1');
                    var filename1 = path.join(commonLevel, 'block-1', 'block-1');
                    var filename2 = path.join(desktopLevel, 'block-1', 'block-1');

                    files[0].fullname.must.be(filename1);
                    files[1].fullname.must.be(filename2);
                })
                .then(done, done);
        });

        it('must detect block dirs in levels', function (done) {
            desktopBundle.runTech(LevelsTech, { levels: desktopLevels })
                .then(function (levels) {
                    var dirs = levels.getBlockEntities('block-1').dirs;
                    var commonDirname = path.join(commonLevel, 'block-1', 'block-1.dir');
                    var desktopDirname = path.join(desktopLevel, 'block-1', 'block-1.dir');

                    dirs[0].fullname.must.be(commonDirname);
                    dirs[1].fullname.must.be(desktopDirname);
                })
                .then(done, done);
        });
    });
});
