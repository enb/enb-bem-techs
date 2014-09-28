var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    depsTech = require('../../techs/deps-old');

describe('techs', function () {
    describe('deps-old', function () {
        var bundle,
            dataBundle,
            shouldJsLevels,
            mustJsLevels,
            noShouldJsLevels,
            noMustJsLevels,
            shouldYamlLevels,
            mustYamlLevels;

        beforeEach(function () {
            mockFs({
                'should-deps-js.blocks': {
                    block: {
                        'block.deps.js': stringifyDepsJs({ shouldDeps: [{ block: 'other-block' }] })
                    },
                    'block-bool-mod': {
                        'block-bool-mod.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', mods: { mod: true } }]
                        })
                    },
                    'block-mod': {
                        'block-mod.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', mods: { modName: 'modVal' } }]
                        })
                    },
                    elem: {
                        'elem.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem' }]
                        })
                    },
                    elems: {
                        'elems.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        })
                    },
                    'elem-bool-mod': {
                        'elem-bool-mod.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        })
                    },
                    'elem-mod': {
                        'elem-mod.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'other-block', elem: 'elem', mods: { modName: 'modVal' } }]
                        })
                    },
                    A: {
                        'A.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'B' }]
                        })
                    },
                    B: {
                        'B.deps.js': stringifyDepsJs({
                            shouldDeps: [{ block: 'A' }]
                        })
                    }
                },
                'must-deps-js.blocks': {
                    block: {
                        'block.deps.js': stringifyDepsJs({ mustDeps: [{ block: 'other-block' }] })
                    },
                    'block-bool-mod': {
                        'block-bool-mod.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', mods: { mod: true } }]
                        })
                    },
                    'block-mod': {
                        'block-mod.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', mods: { modName: 'modVal' } }]
                        })
                    },
                    elem: {
                        'elem.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem' }]
                        })
                    },
                    elems: {
                        'elems.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        })
                    },
                    'elem-bool-mod': {
                        'elem-bool-mod.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        })
                    },
                    'elem-mod': {
                        'elem-mod.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'other-block', elem: 'elem', mods: { modName: 'modVal' } }]
                        })
                    },
                    A: {
                        'A.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'B' }]
                        })
                    },
                    B: {
                        'B.deps.js': stringifyDepsJs({
                            mustDeps: [{ block: 'A' }]
                        })
                    }
                },
                'no-deps-js.blocks': {
                    block: {
                        'block.deps.js': stringifyDepsJs({ noDeps: [{ block: 'other-block' }] })
                    },
                    'block-bool-mod': {
                        'block-bool-mod.deps.js': stringifyDepsJs({
                            noDeps: [{ block: 'other-block', mods: { mod: true } }]
                        })
                    },
                    'block-mod': {
                        'block-mod.deps.js': stringifyDepsJs({
                            noDeps: [{ block: 'other-block', mods: { modName: 'modVal' } }]
                        })
                    },
                    elem: {
                        'elem.deps.js': stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elem: 'elem' }]
                        })
                    },
                    elems: {
                        'elems.deps.js': stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elems: ['elem-1', 'elem-2'] }]
                        })
                    },
                    'elem-bool-mod': {
                        'elem-bool-mod.deps.js': stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elem: 'elem', mods: { mod: true } }]
                        })
                    },
                    'elem-mod': {
                        'elem-mod.deps.js': stringifyDepsJs({
                            noDeps: [{ block: 'other-block', elem: 'elem', mods: { modName: 'modVal' } }]
                        })
                    },
                    B: {
                        'B.deps.js': stringifyDepsJs({
                            noDeps: [{ block: 'A' }]
                        })
                    }
                },
                'should-deps-yaml.blocks': {
                    block: {
                        'block.deps.yaml': '- block: other-block'
                    },
                    'block-bool-mod': {
                        'block-bool-mod.deps.yaml': '- block: other-block\n  mods: { mod: true }'
                    },
                    'block-mod': {
                        'block-mod.deps.yaml': '- block: other-block\n  mods: { modName: modVal }'
                    },
                    elem: {
                        'elem.deps.yaml': '- block: other-block\n  elem: elem'
                    },
                    elems: {
                        'elems.deps.yaml': '- block: other-block\n  elems: [elem-1, elem-2]'
                    },
                    'elem-bool-mod': {
                        'elem-bool-mod.deps.yaml': '- block: other-block\n  elem: elem\n  mods: { mod: true }'
                    },
                    'elem-mod': {
                        'elem-mod.deps.yaml': '- block: other-block\n  elem: elem\n  mods: { modName: modVal }'
                    },
                    A: {
                        'A.deps.yaml': '- A'
                    },
                    B: {
                        'B.deps.yaml': '- B'
                    }
                },
                'must-deps-yaml.blocks': {
                    block: {
                        'block.deps.yaml': '- block: other-block\n  required: true'
                    },
                    'block-bool-mod': {
                        'block-bool-mod.deps.yaml': '- block: other-block\n  required: true\n  mods: { mod: true }'
                    },
                    'block-mod': {
                        'block-mod.deps.yaml': '- block: other-block\n  required: true\n  mods: { modName: modVal }'
                    },
                    elem: {
                        'elem.deps.yaml': '- block: other-block\n  required: true\n  elem: elem'
                    },
                    elems: {
                        'elems.deps.yaml': '- block: other-block\n  required: true\n  elems: [elem-1, elem-2]'
                    },
                    'elem-bool-mod': {
                        'elem-bool-mod.deps.yaml': '- block: other-block\n  required: true\n' +
                        '  elem: elem\n  mods: { mod: true }'
                    },
                    'elem-mod': {
                        'elem-mod.deps.yaml': '- block: other-block\n  required: true\n  required:' +
                        ' true\n  elem: elem\n  mods: { modName: modVal }'
                    },
                    A: {
                        'A.deps.yaml': '- A\n  required: true'
                    },
                    B: {
                        'B.deps.yaml': '- B\n  required: true'
                    }
                },
                bundle: {
                    'block.bemdecl.js': stringifyBemdecl([{ name: 'block' }]),
                    'block-bool-mod.bemdecl.js': stringifyBemdecl([{ name: 'block-bool-mod' }]),
                    'block-mod.bemdecl.js': stringifyBemdecl([{ name: 'block-mod' }]),
                    'elem.bemdecl.js': stringifyBemdecl([{ name: 'elem' }]),
                    'elems.bemdecl.js': stringifyBemdecl([{ name: 'elems' }]),
                    'elem-bool-mod.bemdecl.js': stringifyBemdecl([{ name: 'elem-bool-mod' }]),
                    'elem-mod.bemdecl.js': stringifyBemdecl([{ name: 'elem-mod' }]),
                    'loop.bemdecl.js': stringifyBemdecl([{ name: 'A' }]),
                    'block.deps.js': 'exports.deps = ' + JSON.stringify([{ block: 'block' }]) + ';'
                },
                'data-bundle': {}
            });

            bundle = new TestNode('bundle');
            shouldJsLevels = ['should-deps-js.blocks'];
            mustJsLevels = ['must-deps-js.blocks'];
            noShouldJsLevels = [shouldJsLevels[0], 'no-deps-js.blocks'];
            noMustJsLevels = [mustJsLevels[0], 'no-deps-js.blocks'];
            shouldYamlLevels = [shouldJsLevels[0], 'should-deps-yaml.blocks'];
            mustYamlLevels = [mustJsLevels[0], 'must-deps-yaml.blocks'];

            dataBundle = new TestNode('data-bundle');
            dataBundle.provideTechData('data.bemdecl.js', { blocks: [{ name: 'block' }] });
            dataBundle.provideTechData('data.deps.js', { deps: [{ block: 'block' }] });
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('must provide result target from data at bemdecl format', function (done) {
            dataBundle.runTech(levelsTech, { levels: [] })
                .then(function (levels) {
                    dataBundle.provideTechData('?.levels', levels);

                    return dataBundle.runTechAndGetResults(depsTech, { bemdeclFile: 'data.bemdecl.js' });
                })
                .then(function (results) {
                    results['data-bundle.deps.js'].must.eql({ deps: [{ block: 'block' }] });
                })
                .then(done, done);
        });

        it('must require result target from data at bemdecl format', function (done) {
            dataBundle.runTech(levelsTech, { levels: [] })
                .then(function (levels) {
                    dataBundle.provideTechData('?.levels', levels);

                    return dataBundle.runTechAndRequire(depsTech, { bemdeclFile: 'data.bemdecl.js' });
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
                        bemdeclFile: 'data.deps.js'
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
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
                            bemdeclFile: 'block.deps.js'
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'block-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elems.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-bool-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'elem-mod.bemdecl.js' });
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

                        return bundle.runTechAndRequire(depsTech, { bemdeclFile: 'loop.bemdecl.js' });
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
