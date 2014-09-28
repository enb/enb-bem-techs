var FileSystem = require('enb/lib/test/mocks/test-file-system'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    bemdeclTech = require('../../techs/levels-to-bemdecl');

describe('techs', function () {
    describe('levels-to-bemdecl', function () {
        var fileSystem,
            bundle,
            bemdecl = {
                blocks: [
                    { name: 'fully-block' },
                    {
                        name: 'fully-block',
                        mods: [
                            {
                                name: 'bool-mod'
                            }
                        ]
                    },
                    {
                        name: 'fully-block',
                        mods: [
                            {
                                name: 'mod-name',
                                vals: [{ name: 'mod-val' }]
                            }
                        ]
                    },
                    {
                        name: 'fully-block',
                        elems: [{ name: 'elem' }]
                    },
                    {
                        name: 'fully-block',
                        elems: [{
                            name: 'elem',
                            mods: [
                                {
                                    name: 'bool-mod'
                                }
                            ]
                        }]
                    },
                    {
                        name: 'fully-block',
                        elems: [{
                            name: 'elem',
                            mods: [{
                                name: 'mod-name',
                                vals: [{ name: 'mod-val' }]
                            }]
                        }]
                    }
                ]
            };

        beforeEach(function () {
            fileSystem = new FileSystem([{
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
                        { directory: '_mod-name',
                            items: [
                                { file: 'fully-block_mod-name_mod-val' },
                                { directory: 'fully-block_mod-name_mod-val.dir', items: [] }
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
                                { directory: '_mod-name',
                                    items: [
                                        { file: 'fully-block__elem_mod-name_mod-val' },
                                        { directory: 'fully-block__elem_mod-name_mod-val.dir', items: [] }
                                    ]
                                }
                            ]
                        }
                    ]
                }]
            },
            {
                directory: 'bundle',
                items: []
            }]);
            fileSystem.setup();

            bundle = new TestNode('bundle');
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must provide result target', function (done) {
            bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndGetResults(bemdeclTech);
                })
                .then(function (results) {
                    results['bundle.bemdecl.js'].must.eql(bemdecl);
                })
                .then(done, done);
        });

        it('must require result target', function (done) {
            bundle.runTech(levelsTech, { levels: ['blocks'] })
                .then(function (levels) {
                    bundle.provideTechData('?.levels', levels);

                    return bundle.runTechAndRequire(bemdeclTech);
                })
                .spread(function (target) {
                    target.must.eql(bemdecl);
                })
                .then(done, done);
        });
    });
});
