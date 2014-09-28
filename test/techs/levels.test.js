var path = require('path'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    LevelsTech = require('../../techs/levels'),
    cwd = process.cwd();

describe('techs', function () {
    describe('levels', function () {
        var bundle,
            desktopBundle,
            blocksDirname,
            commonLevel,
            desktopLevel,
            desktopLevels,
            fullyBlockDirname,
            fullyCommonLevel,
            fullyDesktopLevel,
            fullyDesktopLevels;

        beforeEach(function () {
            mockFs({
                blocks: {
                    'fully-block': {
                        'fully-block': '',
                        'fully-block.dir': {},
                        '_bool-mod': {
                            'fully-block_bool-mod': '',
                            'fully-block_bool-mod.dir': {}
                        },
                        '_mod-name': {
                            'fully-block_mod-name_mod-val': '',
                            'fully-block_mod-name_mod-val.dir': {}
                        },
                        __elem: {
                            'fully-block__elem': '',
                            'fully-block__elem.dir': {},
                            '_bool-mod': {
                                'fully-block__elem_bool-mod': '',
                                'fully-block__elem_bool-mod.dir': {}
                            },
                            '_mod-name': {
                                'fully-block__elem_mod-name_mod-val': '',
                                'fully-block__elem_mod-name_mod-val.dir': {}
                            }
                        }
                    }
                },
                'common.blocks': {
                    'block-1': {
                        'block-1': '',
                        'block-1.dir': {}
                    }
                },
                'desktop.blocks': {
                    'block-1': {
                        'block-1': '',
                        'block-1.dir': {}
                    }
                },
                bundle: {},
                'desktop.bundle': {}
            });

            bundle = new TestNode('bundle');
            desktopBundle = new TestNode('desktop.bundle');

            blocksDirname = 'blocks';
            commonLevel = 'common.blocks';
            desktopLevel = 'desktop.blocks';
            desktopLevels = [commonLevel, desktopLevel];

            fullyBlockDirname = path.join(cwd, 'blocks', 'fully-block');

            fullyCommonLevel = path.join(cwd, commonLevel);
            fullyDesktopLevel = path.join(cwd, desktopLevel);
            fullyDesktopLevels = [fullyCommonLevel, fullyDesktopLevel];
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must detect block file in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block',
                        file = levels.getBlockFiles('fully-block')[0],
                        filename = path.join(fullyBlockDirname, name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect block dir in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block',
                        dir = levels.getBlockEntities('fully-block').dirs[0],
                        dirname = path.join(fullyBlockDirname, name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect boolean mod file of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_bool-mod',
                        file = levels.getBlockFiles('fully-block', 'bool-mod', true)[0],
                        filename = path.join(fullyBlockDirname, '_bool-mod', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect boolean mod dir of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_bool-mod',
                        dir = levels.getBlockEntities('fully-block', 'bool-mod', true).dirs[0],
                        dirname = path.join(fullyBlockDirname, '_bool-mod', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect mod file of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_mod-name_mod-val',
                        file = levels.getBlockFiles('fully-block', 'mod-name', 'mod-val')[0],
                        filename = path.join(fullyBlockDirname, '_mod-name', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect mod dir of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block_mod-name_mod-val',
                        dir = levels.getBlockEntities('fully-block', 'mod-name', 'mod-val').dirs[0],
                        dirname = path.join(fullyBlockDirname, '_mod-name', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect elem file of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem',
                        file = levels.getElemFiles('fully-block', 'elem')[0],
                        filename = path.join(fullyBlockDirname, '__elem', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect elem dir of block in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem',
                        dir = levels.getElemEntities('fully-block', 'elem').dirs[0],
                        dirname = path.join(fullyBlockDirname, '__elem', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect boolean mod file of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_bool-mod',
                        file = levels.getElemFiles('fully-block', 'elem', 'bool-mod', true)[0],
                        filename = path.join(fullyBlockDirname, '__elem', '_bool-mod', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect boolean mod file of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_bool-mod',
                        dir = levels.getElemEntities('fully-block', 'elem', 'bool-mod', true).dirs[0],
                        dirname = path.join(fullyBlockDirname, '__elem', '_bool-mod', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect mod file of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_mod-name_mod-val',
                        file = levels.getElemFiles('fully-block', 'elem', 'mod-name', 'mod-val')[0],
                        filename = path.join(fullyBlockDirname, '__elem', '_mod-name', name);

                    file.fullname.must.be(filename);
                })
                .then(done, done);
        });

        it('must detect mod dir of elem in level', function (done) {
            bundle.runTech(LevelsTech, { levels: [blocksDirname] })
                .then(function (levels) {
                    var name = 'fully-block__elem_mod-name_mod-val',
                        dir = levels.getElemEntities('fully-block', 'elem', 'mod-name', 'mod-val').dirs[0],
                        dirname = path.join(fullyBlockDirname, '__elem', '_mod-name', name + '.dir');

                    dir.fullname.must.be(dirname);
                })
                .then(done, done);
        });

        it('must detect block files in levels', function (done) {
            desktopBundle.runTech(LevelsTech, { levels: desktopLevels })
                .then(function (levels) {
                    var files = levels.getBlockFiles('block-1'),
                        filename1 = path.join(fullyCommonLevel, 'block-1', 'block-1'),
                        filename2 = path.join(fullyDesktopLevel, 'block-1', 'block-1');

                    files[0].fullname.must.be(filename1);
                    files[1].fullname.must.be(filename2);
                })
                .then(done, done);
        });

        it('must detect block dirs in levels', function (done) {
            desktopBundle.runTech(LevelsTech, { levels: desktopLevels })
                .then(function (levels) {
                    var dirs = levels.getBlockEntities('block-1').dirs,
                        commonDirname = path.join(fullyCommonLevel, 'block-1', 'block-1.dir'),
                        desktopDirname = path.join(fullyDesktopLevel, 'block-1', 'block-1.dir');

                    dirs[0].fullname.must.be(commonDirname);
                    dirs[1].fullname.must.be(desktopDirname);
                })
                .then(done, done);
        });

        it('must handle full paths', function (done) {
            desktopBundle.runTech(LevelsTech, { levels: fullyDesktopLevels })
                .then(function (levels) {
                    var dirs = levels.getBlockEntities('block-1').dirs,
                        commonDirname = path.join(fullyCommonLevel, 'block-1', 'block-1.dir'),
                        desktopDirname = path.join(fullyDesktopLevel, 'block-1', 'block-1.dir');

                    dirs[0].fullname.must.be(commonDirname);
                    dirs[1].fullname.must.be(desktopDirname);
                })
                .then(done, done);
        });
    });
});
