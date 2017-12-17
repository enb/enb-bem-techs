'use strict';

const vow = require('vow');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const techs = require('../..');
const levelsTech = techs.levels;
const levelsToBemdeclTech = techs.levelsToBemdecl;

describe('techs: levels-to-bemdecl', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must support deps format', () => {
        const scheme = {
            blocks: {
                block: {
                    'block.ext': ''
                }
            }
        };

        const bemdecl = [{ block: 'block' }];

        return assert(scheme, bemdecl, { bemdeclFormat: 'deps' });
    });

    it('must detect block', () => {
        const scheme = {
            blocks: {
                block: {
                    'block.ext': ''
                }
            }
        };

        const bemdecl = [{ name: 'block' }];

        return assert(scheme, bemdecl);
    });

    it('must detect boolean mod of block', () => {
        const scheme = {
            blocks: {
                block: {
                    '_bool-mod': {
                        'block_bool-mod.ext': ''
                    }
                }
            }
        };

        const bemdecl = [
            { name: 'block', mods: [{ name: 'bool-mod', vals: [] }] }
        ];

        return assert(scheme, bemdecl);
    });

    it('must detect mod of block', () => {
        const scheme = {
            blocks: {
                block: {
                    '_mod-name': {
                        'block_mod-name_mod-val.ext': ''
                    }
                }
            }
        };

        const bemdecl = [
            { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
        ];

        return assert(scheme, bemdecl);
    });

    it('must detect elem', () => {
        const scheme = {
            blocks: {
                block: {
                    '__elem-name': {
                        'block__elem-name.ext': ''
                    }
                }
            }
        };

        const bemdecl = [
            { name: 'block', elems: [{ name: 'elem-name' }] }
        ];

        return assert(scheme, bemdecl);
    });

    it('must detect boolean mod of elem', () => {
        const scheme = {
            blocks: {
                block: {
                    '__elem-name': {
                        '_bool-mod': {
                            'block__elem-name_bool-mod.ext': ''
                        }
                    }
                }
            }
        };

        const bemdecl = [
            { name: 'block', elems: [
                { name: 'elem-name', mods: [{ name: 'bool-mod', vals: [] }] }
            ] }
        ];

        return assert(scheme, bemdecl);
    });

    it('must detect mod of elem', () => {
        const scheme = {
            blocks: {
                block: {
                    '__elem-name': {
                        '_mod-name': {
                            'block__elem-name_mod-name_mod-val.ext': ''
                        }
                    }
                }
            }
        };

        const bemdecl = [
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

    const levelPaths = Object.keys(fsScheme);
    let dataBundle = new TestNode('data-bundle');
    let fsBundle;

    fsScheme['data-bundle'] = {};
    fsScheme['fs-bundle'] = {};

    mockFs(fsScheme);

    dataBundle = new TestNode('data-bundle');
    fsBundle = new TestNode('fs-bundle');

    return fsBundle.runTech(levelsTech, { levels: levelPaths })
        .then(levels => {
            fsBundle.provideTechData('?.levels', levels);
            dataBundle.provideTechData('?.levels', levels);

            return vow.all([
                fsBundle.runTechAndGetResults(levelsToBemdeclTech, options),
                fsBundle.runTechAndRequire(levelsToBemdeclTech, options),
                dataBundle.runTechAndGetResults(levelsToBemdeclTech, options),
                dataBundle.runTechAndRequire(levelsToBemdeclTech, options)
            ]);
        })
        .spread((data1, target1, data2, target2) => {
            const isDepsFormat = options.bemdeclFormat === 'deps';
            const actualDecl1 = isDepsFormat ? data1['fs-bundle.bemdecl.js'].deps
                : data1['fs-bundle.bemdecl.js'].blocks;

            const actualDecl2 = isDepsFormat ?
                data2['data-bundle.bemdecl.js'].deps :
                data2['data-bundle.bemdecl.js'].blocks;

            const actualData1 = isDepsFormat ? target1[0].deps : target1[0].blocks;
            const actualData2 = isDepsFormat ? target2[0].deps : target1[0].blocks;

            actualDecl1.must.eql(expected);
            actualDecl2.must.eql(expected);
            actualData1.must.eql(expected);
            actualData2.must.eql(expected);
        });
}
