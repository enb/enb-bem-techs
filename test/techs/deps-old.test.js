var path = require('path'),
    FileSystem = require('enb/lib/test/mocks/test-file-system'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    depsTech = require('../../techs/deps-old');

describe('techs', function () {
    describe('deps-old', function () {
        var fileSystem,
            bundle,
            dataBundle,
            shouldJsLevels,
            mustJsLevels,
            noShouldJsLevels,
            noMustJsLevels,
            shouldYamlLevels,
            mustYamlLevels;

        beforeEach(function () {
            fileSystem = new FileSystem([{
                directory: 'should-deps-js.blocks', items: [
                    { directory: 'block', items: [
                        { file: 'block.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block' }]
                        }) }
                    ] },
                    { directory: 'block-bool-mod', items: [
                        { file: 'block-bool-mod.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'block-mod', items: [
                        { file: 'block-mod.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', mods: { modName: 'modVal' } }]
                        }) }
                    ] },
                    { directory: 'elem', items: [
                        { file: 'elem.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                        }) }
                    ] },
                    { directory: 'elems', items: [
                        { file: 'elems.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        }) }
                    ] },
                    { directory: 'elem-bool-mod', items: [
                        { file: 'elem-bool-mod.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'elem-mod', items: [
                        { file: 'elem-mod.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem', mods: { modName: 'modVal' } }]
                        }) }
                    ] },

                    { directory: 'A', items: [
                        { file: 'A.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'B' }]
                        }) }
                    ] },
                    { directory: 'B', items: [
                        { file: 'B.deps.js', content: stringifyDepsJs({
                            shouldDeps: [{ block: 'A' }]
                        }) }
                    ] }
                ]
            }, {
                directory: 'must-deps-js.blocks', items: [
                    { directory: 'block', items: [
                        { file: 'block.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'other-block' }]
                        }) }
                    ] },
                    { directory: 'block-bool-mod', items: [
                        { file: 'block-bool-mod.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'block-mod', items: [
                        { file: 'block-mod.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', mods: { modName: 'modVal' } }]
                        }) }
                    ] },
                    { directory: 'elem', items: [
                        { file: 'elem.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem' }]
                        }) }
                    ] },
                    { directory: 'elems', items: [
                        { file: 'elems.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        }) }
                    ] },
                    { directory: 'elem-bool-mod', items: [
                        { file: 'elem-bool-mod.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'elem-mod', items: [
                        { file: 'elem-mod.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem', mods: { modName: 'modVal' } }]
                        }) }
                    ] },

                    { directory: 'A', items: [
                        { file: 'A.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'B' }]
                        }) }
                    ] },
                    { directory: 'B', items: [
                        { file: 'B.deps.js', content: stringifyDepsJs({
                            mustDeps: [{ block: 'A' }]
                        }) }
                    ] }
                ]
            }, {
                directory: 'no-deps-js.blocks', items: [
                    { directory: 'block', items: [
                        { file: 'block.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'other-block' }]
                        }) }
                    ] },
                    { directory: 'block-bool-mod', items: [
                        { file: 'block-bool-mod.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'other-block', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'block-mod', items: [
                        { file: 'block-mod.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'other-block', mods: { modName: 'modVal' } }]
                        }) }
                    ] },
                    { directory: 'elem', items: [
                        { file: 'elem.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elem: 'elem' }]
                        }) }
                    ] },
                    { directory: 'elems', items: [
                        { file: 'elems.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        }) }
                    ] },
                    { directory: 'elem-bool-mod', items: [
                        { file: 'elem-bool-mod.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        }) }
                    ] },
                    { directory: 'elem-mod', items: [
                        { file: 'elem-mod.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elem: 'elem', mods: { modName: 'modVal' } }]
                        }) }
                    ] },

                    { directory: 'B', items: [
                        { file: 'B.deps.js', content: stringifyDepsJs({
                            noDeps: [{ block: 'A' }]
                        }) }
                    ] }
                ]
            }, {
                directory: 'should-deps-yaml.blocks', items: [
                    { directory: 'block', items: [
                        { file: 'block.deps.yaml', content: '- block: other-block' }
                    ] },
                    { directory: 'block-bool-mod', items: [
                        { file: 'block-bool-mod.deps.yaml', content: '- block: other-block\n  mods: { mod: true }' }
                    ] },
                    { directory: 'block-mod', items: [
                        { file: 'block-mod.deps.yaml', content: '- block: other-block\n  mods: { modName: modVal }' }
                    ] },
                    { directory: 'elem', items: [
                        { file: 'elem.deps.yaml', content: '- block: other-block\n  elem: elem' }
                    ] },
                    { directory: 'elems', items: [
                        { file: 'elems.deps.yaml', content: '- block: other-block\n  elems: [elem-1, elem-2]' }
                    ] },
                    { directory: 'elem-bool-mod', items: [
                        { file: 'elem-bool-mod.deps.yaml',
                          content: '- block: other-block\n  elem: elem\n  mods: { mod: true }' }
                    ] },
                    { directory: 'elem-mod', items: [
                        { file: 'elem-mod.deps.yaml',
                          content: '- block: other-block\n  elem: elem\n  mods: { modName: modVal }' }
                    ] },

                    { directory: 'A', items: [
                        { file: 'A.deps.yaml', content: '- A' }
                    ] },
                    { directory: 'B', items: [
                        { file: 'B.deps.yaml', content: '- B' }
                    ] }
                ]
            }, {
                directory: 'must-deps-yaml.blocks', items: [
                    { directory: 'block', items: [
                        { file: 'block.deps.yaml', content: '- block: other-block\n  required: true' }
                    ] },
                    { directory: 'block-bool-mod', items: [
                        { file: 'block-bool-mod.deps.yaml',
                          content: '- block: other-block\n  required: true\n  mods: { mod: true }' }
                    ] },
                    { directory: 'block-mod', items: [
                        { file: 'block-mod.deps.yaml',
                          content: '- block: other-block\n  required: true\n  mods: { modName: modVal }' }
                    ] },
                    { directory: 'elem', items: [
                        { file: 'elem.deps.yaml',
                          content: '- block: other-block\n  required: true\n  elem: elem' }
                    ] },
                    { directory: 'elems', items: [
                        { file: 'elems.deps.yaml',
                          content: '- block: other-block\n  required: true\n  elems: [elem-1, elem-2]' }
                    ] },
                    { directory: 'elem-bool-mod', items: [
                        { file: 'elem-bool-mod.deps.yaml',
                          content: '- block: other-block\n  required: true\n  elem: elem\n  mods: { mod: true }' }
                    ] },
                    { directory: 'elem-mod', items: [
                        { file: 'elem-mod.deps.yaml',
                          content: '- block: other-block\n  required: true\n  elem: elem\n  mods: { modName: modVal }' }
                    ] },

                    { directory: 'A', items: [
                        { file: 'A.deps.yaml', content: '- block: A\n  required: true' }
                    ] },
                    { directory: 'B', items: [
                        { file: 'B.deps.yaml', content: '- block: B\n  required: true' }
                    ] }
                ]
            }, {
                directory: 'bundle', items: [
                    { file: 'block.bemdecl.js', content: stringifyBemdecl([{ name: 'block' }]) },
                    { file: 'block-bool-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'block-bool-mod' }]) },
                    { file: 'block-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'block-mod' }]) },
                    { file: 'elem.bemdecl.js', content: stringifyBemdecl([{ name: 'elem' }]) },
                    { file: 'elems.bemdecl.js', content: stringifyBemdecl([{ name: 'elems' }]) },
                    { file: 'elem-bool-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'elem-bool-mod' }]) },
                    { file: 'elem-mod.bemdecl.js', content: stringifyBemdecl([{ name: 'elem-mod' }]) },
                    { file: 'loop.bemdecl.js', content: stringifyBemdecl([{ name: 'A' }]) },

                    { file: 'block.deps.js', content: 'exports.deps = ' + JSON.stringify([{ block: 'block' }]) + ';' }
                ]
            }, {
                directory: 'data-bundle', items: []
            }]);

            fileSystem.setup();

            bundle = new TestNode('bundle');
            shouldJsLevels = [path.join(fileSystem._root, 'should-deps-js.blocks')];
            mustJsLevels = [path.join(fileSystem._root, 'must-deps-js.blocks')];
            noShouldJsLevels = [shouldJsLevels[0], path.join(fileSystem._root, 'no-deps-js.blocks')];
            noMustJsLevels = [mustJsLevels[0], path.join(fileSystem._root, 'no-deps-js.blocks')];
            shouldYamlLevels = [shouldJsLevels[0], path.join(fileSystem._root, 'should-deps-yaml.blocks')];
            mustYamlLevels = [mustJsLevels[0], path.join(fileSystem._root, 'must-deps-yaml.blocks')];

            dataBundle = new TestNode('data-bundle');
            dataBundle.provideTechData('data.bemdecl.js', [{ name: 'block' }]);
            dataBundle.provideTechData('data.deps.js', [{ block: 'block' }]);
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must provide result target from data at bemdecl format', function (done) {
            dataBundle.runTech(levelsTech, { levels: [] })
                .then(function (levels) {
                    dataBundle.provideTechData('?.levels', levels);

                    return dataBundle.runTechAndGetResults(depsTech, { sourceDepsFile: 'data.bemdecl.js' });
                })
                .then(function (results) {
                    results['data-bundle.deps.js'].must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must require result target from data at bemdecl format', function (done) {
            dataBundle.runTech(levelsTech, { levels: [] })
                .then(function (levels) {
                    dataBundle.provideTechData('?.levels', levels);

                    return dataBundle.runTechAndRequire(depsTech, { sourceDepsFile: 'data.bemdecl.js' });
                })
                .spread(function (target) {
                    target.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must require result target from data at deps format', function (done) {
            dataBundle.runTech(levelsTech, { levels: [] })
                .then(function (levels) {
                    dataBundle.provideTechData('?.levels', levels);

                    return dataBundle.runTechAndRequire(depsTech, {
                        sourceDepsFile: 'data.deps.js',
                        format: 'data.deps.js'
                    });
                })
                .spread(function (target) {
                    target.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        describe('deps.js format', function () {
            it('must add should dep of block at bemdecl format', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block' },
                            { block: 'other-block' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of block at deps format', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, {
                            sourceDepsFile: 'block.deps.js',
                            format: 'deps'
                        });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block' },
                            { block: 'other-block' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of block boolean mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block-bool-mod' },
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'mod' },
                            { block: 'other-block', mod: 'mod', val: true }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of block mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block-mod' },
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'modName' },
                            { block: 'other-block', mod: 'modName', val: 'modVal' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elem', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elem' },
                            { block: 'other-block', elem: 'elem' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elems', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elems.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elems' },
                            { block: 'other-block' },
                            { block: 'other-block', elem: 'elem-1' },
                            { block: 'other-block', elem: 'elem-2' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elem bool mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elem-bool-mod' },
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'mod' },
                            { block: 'other-block', elem: 'elem', mod: 'mod', val: true }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elem mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elem-mod' },
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'modName' },
                            { block: 'other-block', elem: 'elem', mod: 'modName', val: 'modVal' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add loop shouldDeps', function (done) {
                bundle.runTech(levelsTech, { levels: shouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'loop.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'A' },
                            { block: 'B' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of block', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'block' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of block boolean mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'mod' },
                            { block: 'other-block', mod: 'mod', val: true },
                            { block: 'block-bool-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of block mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'modName' },
                            { block: 'other-block', mod: 'modName', val: 'modVal' },
                            { block: 'block-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elem', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block', elem: 'elem' },
                            { block: 'elem' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elems', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elems.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'other-block', elem: 'elem-1' },
                            { block: 'other-block', elem: 'elem-2' },
                            { block: 'elems' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elem bool mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'mod' },
                            { block: 'other-block', elem: 'elem', mod: 'mod', val: true },
                            { block: 'elem-bool-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elem mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'modName' },
                            { block: 'other-block', elem: 'elem', mod: 'modName', val: 'modVal' },
                            { block: 'elem-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add loop mustDeps', function (done) {
                bundle.runTech(levelsTech, { levels: mustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'loop.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'B' },
                            { block: 'A' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must remove should dep of block', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'block' }]);
                    })
                    .then(done, done);
            });

            it('must remove should dep of block boolean mod', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'block-bool-mod' }]);
                    })
                    .then(done, done);
            });

            it('must remove should dep of block mod', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'block-mod' }]);
                    })
                    .then(done, done);
            });

            it('must remove should dep of elem', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elem' }]);
                    })
                    .then(done, done);
            });

            it('must remove should dep of elems', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elems.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elems' }]);
                    })
                    .then(done, done);
            });

            it('must remove should dep of elem bool mod', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elem-bool-mod' }]);
                    })
                    .then(done, done);
            });

            it('must remove should dep of elem mod', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elem-mod' }]);
                    })
                    .then(done, done);
            });

            it('must break shouldDeps loop', function (done) {
                bundle.runTech(levelsTech, { levels: noShouldJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'loop.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'A' },
                            { block: 'B' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must remove must dep of block', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'block' }]);
                    })
                    .then(done, done);
            });

            it('must remove must dep of block boolean mod', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'block-bool-mod' }]);
                    })
                    .then(done, done);
            });

            it('must remove must dep of block mod', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'block-mod' }]);
                    })
                    .then(done, done);
            });

            it('must remove must dep of elem', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elem' }]);
                    })
                    .then(done, done);
            });

            it('must remove must dep of elems', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elems.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elems' }]);
                    })
                    .then(done, done);
            });

            it('must remove must dep of elem bool mod', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elem-bool-mod' }]);
                    })
                    .then(done, done);
            });

            it('must remove must dep of elem mod', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([{ block: 'elem-mod' }]);
                    })
                    .then(done, done);
            });

            it('must break mustDeps loop', function (done) {
                bundle.runTech(levelsTech, { levels: noMustJsLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'loop.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'B' },
                            { block: 'A' }
                        ]);
                    })
                    .then(done, done);
            });
        });

        describe('deps.yaml format', function () {
            it('must add should dep of block', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block' },
                            { block: 'other-block' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of block boolean mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block-bool-mod' },
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'mod' },
                            { block: 'other-block', mod: 'mod', val: true }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of block mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'block-mod' },
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'modName' },
                            { block: 'other-block', mod: 'modName', val: 'modVal' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elem', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elem' },
                            { block: 'other-block', elem: 'elem' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elems', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elems.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elems' },
                            { block: 'other-block' },
                            { block: 'other-block', elem: 'elem-1' },
                            { block: 'other-block', elem: 'elem-2' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elem bool mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elem-bool-mod' },
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'mod' },
                            { block: 'other-block', elem: 'elem', mod: 'mod', val: true }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add should dep of elem mod', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'elem-mod' },
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'modName' },
                            { block: 'other-block', elem: 'elem', mod: 'modName', val: 'modVal' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add loop shouldDeps', function (done) {
                bundle.runTech(levelsTech, { levels: shouldYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'loop.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'A' },
                            { block: 'B' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of block', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'block' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of block boolean mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'mod' },
                            { block: 'other-block', mod: 'mod', val: true },
                            { block: 'block-bool-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of block mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'block-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'other-block', mod: 'modName' },
                            { block: 'other-block', mod: 'modName', val: 'modVal' },
                            { block: 'block-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elem', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block', elem: 'elem' },
                            { block: 'elem' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elems', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elems.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block' },
                            { block: 'other-block', elem: 'elem-1' },
                            { block: 'other-block', elem: 'elem-2' },
                            { block: 'elems' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elem bool mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-bool-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'mod' },
                            { block: 'other-block', elem: 'elem', mod: 'mod', val: true },
                            { block: 'elem-bool-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add must dep of elem mod', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'elem-mod.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'other-block', elem: 'elem' },
                            { block: 'other-block', elem: 'elem', mod: 'modName' },
                            { block: 'other-block', elem: 'elem', mod: 'modName', val: 'modVal' },
                            { block: 'elem-mod' }
                        ]);
                    })
                    .then(done, done);
            });

            it('must add loop mustDeps', function (done) {
                bundle.runTech(levelsTech, { levels: mustYamlLevels })
                    .then(function (levels) {
                        bundle.provideTechData('?.levels', levels);

                        return bundle.runTechAndRequire(depsTech, { sourceDepsFile: 'loop.bemdecl.js' });
                    })
                    .spread(function (target) {
                        target.deps.must.eql([
                            { block: 'B' },
                            { block: 'A' }
                        ]);
                    })
                    .then(done, done);
            });
        });
    });
});

function stringifyDepsJs(bemjson) {
    return '(' + JSON.stringify(bemjson) + ')';
}

function stringifyBemdecl(bemjson) {
    return 'exports.blocks = ' + JSON.stringify(bemjson) + ';';
}
