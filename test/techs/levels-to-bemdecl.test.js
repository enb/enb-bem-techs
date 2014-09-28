var mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    levelsTech = require('../../techs/levels'),
    bemdeclTech = require('../../techs/levels-to-bemdecl');

describe('techs', function () {
    describe('levels-to-bemdecl', function () {
        var bundle,
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
                bundle: {}
            });

            bundle = new TestNode('bundle');
        });

        afterEach(function () {
            mockFs.restore();
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
