var vow = require('vow'),

    mockFs = require('mock-fs'),
    TestNode = require('mock-enb/lib/mock-node'),

    techs = require('../utils/techs'),
    levelsTech = techs.levels,
    levelsToBemdeclTech = techs.levelsToBemdecl;

describe('techs: levels-to-bemdecl', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must support deps format', function () {
        var scheme = {
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                }
            },
            bemdecl = [{ block: 'block' }];

        return assert(scheme, bemdecl, { bemdeclFormat: 'deps' });
    });

    it('must detect block', function () {
        var scheme = {
                blocks: {
                    block: {
                        'block.ext': ''
                    }
                }
            },
            bemdecl = [{ name: 'block' }];

        return assert(scheme, bemdecl);
    });

    it('must detect boolean mod of block', function () {
        var scheme = {
                blocks: {
                    block: {
                        '_bool-mod': {
                            'block_bool-mod.ext': ''
                        }
                    }
                }
            },
            bemdecl = [
                { name: 'block', mods: [{ name: 'bool-mod', vals: [{ name: true }] }] }
            ];

        return assert(scheme, bemdecl);
    });

    it('must detect mod of block', function () {
        var scheme = {
                blocks: {
                    block: {
                        '_mod-name': {
                            'block_mod-name_mod-val.ext': ''
                        }
                    }
                }
            },
            bemdecl = [
                { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
            ];

        return assert(scheme, bemdecl);
    });

    it('must detect elem', function () {
        var scheme = {
                blocks: {
                    block: {
                        '__elem-name': {
                            'block__elem-name.ext': ''
                        }
                    }
                }
            },
            bemdecl = [
                { name: 'block', elems: [{ name: 'elem-name' }] }
            ];

        return assert(scheme, bemdecl);
    });

    it('must detect boolean mod of elem', function () {
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
            bemdecl = [
                { name: 'block', elems: [
                    { name: 'elem-name', mods: [{ name: 'bool-mod', vals: [{ name: true }] }] }
                ] }
            ];

        return assert(scheme, bemdecl);
    });

    it('must detect mod of elem', function () {
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
            bemdecl = [
                { name: 'block', elems: [{
                    name: 'elem-name',
                    mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }]
                }] }
            ];

        return assert(scheme, bemdecl);
    });
});

function assert(fsScheme, expected, options) {
    options || (options = {});

    var levels = Object.keys(fsScheme),
        dataBundle = new TestNode('data-bundle'),
        fsBundle;

    fsScheme['data-bundle'] = {};
    fsScheme['fs-bundle'] = {};

    mockFs(fsScheme);

    dataBundle = new TestNode('data-bundle');
    fsBundle = new TestNode('fs-bundle');

    return fsBundle.runTech(levelsTech, { levels: levels })
        .then(function (levels) {
            fsBundle.provideTechData('?.levels', levels);
            dataBundle.provideTechData('?.levels', levels);

            return vow.all([
                fsBundle.runTechAndGetResults(levelsToBemdeclTech, options),
                fsBundle.runTechAndRequire(levelsToBemdeclTech, options),
                dataBundle.runTechAndGetResults(levelsToBemdeclTech, options),
                dataBundle.runTechAndRequire(levelsToBemdeclTech, options)
            ]);
        })
        .spread(function (data1, target1, data2, target2) {
            var isDepsFormat = options.bemdeclFormat === 'deps',
                actualDecl1 = isDepsFormat ? data1['fs-bundle.bemdecl.js'].deps : data1['fs-bundle.bemdecl.js'].blocks,
                actualDecl2 = isDepsFormat ?
                    data2['data-bundle.bemdecl.js'].deps :
                    data2['data-bundle.bemdecl.js'].blocks,
                actualData1 = isDepsFormat ? target1[0].deps : target1[0].blocks,
                actualData2 = isDepsFormat ? target2[0].deps : target1[0].blocks;

            actualDecl1.must.eql(expected);
            actualDecl2.must.eql(expected);
            actualData1.must.eql(expected);
            actualData2.must.eql(expected);
        });
}
