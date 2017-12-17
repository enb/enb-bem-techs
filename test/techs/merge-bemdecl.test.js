'use strict';

const path = require('path');
const vow = require('vow');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const Tech = require('../..').mergeBemdecl;

describe('techs: merge-bemdecl', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must provide result', () => {
        const sources = [[{ name: 'block' }]];
        const bemdecl = [{ name: 'block' }];

        return assert(sources, bemdecl);
    });

    it('must provide result from cache', () => {
        mockFs({
            bundle: {
                'bundle.bemdecl.js': `exports.blocks = ${JSON.stringify([
                    { name: 'other-block' }
                ])};`,
                'bundle-1.bemdecl.js': `exports.blocks = ${JSON.stringify([{ name: 'block-1' }])};`,
                'bundle-2.bemdecl.js': `exports.blocks = ${JSON.stringify([{ name: 'block-2' }])};`
            }
        });

        const bundle = new TestNode('bundle');
        const cache = bundle.getNodeCache('bundle.bemdecl.js');
        const sourcePath1 = path.resolve('bundle', 'bundle-1.bemdecl.js');
        const sourcePath2 = path.resolve('bundle', 'bundle-2.bemdecl.js');

        cache.cacheFileInfo('bemdecl-file', path.resolve('bundle', 'bundle.bemdecl.js'));
        cache.cacheFileInfo(sourcePath1, sourcePath1);
        cache.cacheFileInfo(sourcePath2, sourcePath2);

        return bundle.runTech(Tech, { sources: ['bundle-1.bemdecl.js', 'bundle-2.bemdecl.js'] })
            .then(target => {
                target.blocks.must.eql([{ name: 'other-block' }]);
            });
    });

    it('must support mods without vals', () => {
        const bemdecl1 = [{
            name: 'block-1',
            mods: [{ name: 'mod' }]
        }];

        const bemdecl2 = [{
            name: 'block-2'
        }];

        const exepted = [
            { name: 'block-1', mods: [{ name: 'mod', vals: [] }] },
            { name: 'block-2' }
        ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge block with mod of block', () => {
        const bemdecl1 = [{ name: 'block' }];

        const bemdecl2 = [{
            name: 'block',
            mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }]
        }];

        const exepted = [
            { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
        ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge block with elem', () => {
        const bemdecl1 = [{ name: 'block' }];

        const bemdecl2 = [{
            name: 'block',
            elems: [{ name: 'elem' }]
        }];

        const exepted = [
            { name: 'block', elems: [{ name: 'elem' }] }
        ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge elem with mod of elem', () => {
        const bemdecl1 = [{
            name: 'block',
            elems: [{ name: 'elem' }]
        }];

        const bemdecl2 = [{
            name: 'block',
            elems: [{ name: 'elem', mods: [{ name: 'modName', vals: [{ name: 'modVal' }] }] }]
        }];

        const exepted = [{ name: 'block', elems: [{ name: 'elem', mods: [ { name: 'modName', vals: [{ name: 'modVal' }] } ] }] }];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge elems of block', () => {
        const bemdecl1 = [{
            name: 'block',
            elems: [{ name: 'elem-1' }]
        }];

        const bemdecl2 = [{
            name: 'block',
            elems: [{ name: 'elem-2' }]
        }];

        const exepted = [
            { name: 'block', elems: [{ name: 'elem-1' }, { name: 'elem-2' }] }
        ];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge set with empty set', () => {
        const bemdecl1 = [];
        const bemdecl2 = [{ name: '1' }, { name: '2' }, { name: '3' }];
        const exepted = [{ name: '1' }, { name: '2' }, { name: '3' }];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge intersecting sets', () => {
        const bemdecl1 = [{ name: '1' }, { name: '2' }, { name: '3' }];
        const bemdecl2 = [{ name: '2' }];
        const exepted = [{ name: '1' }, { name: '2' }, { name: '3' }];

        return assert([bemdecl1, bemdecl2], exepted);
    });

    it('must merge disjoint sets', () => {
        const bemdecl1 = [{ name: '1' }, { name: '2' }, { name: '3' }];
        const bemdecl2 = [{ name: 'O_o' }];
        const exepted = [{ name: '1' }, { name: '2' }, { name: '3' }, { name: 'O_o' }];

        return assert([bemdecl1, bemdecl2], exepted);
    });
});

function assert(sources, expected) {
    let bundle;
    const dir = {};
    const options = { sources: [] };

    sources.forEach((bemdecl, i) => {
        const target = `${i}.bemdecl.js`;

        dir[target] = `exports.blocks = ${JSON.stringify(bemdecl)};`;
        options.sources.push(target);
    });

    mockFs({ bundle: dir });
    bundle = (new TestNode('bundle'));

    return vow.all([
            bundle.runTechAndGetResults(Tech, options),
            bundle.runTechAndRequire(Tech, options)
        ])
        .spread((target1, target2) => {
            target1['bundle.bemdecl.js'].blocks.must.eql(expected);
            target2[0].blocks.must.eql(expected);
        });
}
