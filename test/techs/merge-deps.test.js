'use strict';

const path = require('path');
const vow = require('vow');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const Tech = require('../..').mergeDeps;

describe('techs: merge-deps', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must provide result from data', () => {
        mockFs({
            bundle: {}
        });

        const bundle = new TestNode('bundle');

        bundle.provideTechData('bundle-1.deps.js', { deps: [{ block: 'block-1' }] });
        bundle.provideTechData('bundle-2.deps.js', { deps: [{ block: 'block-2' }] });

        return bundle.runTech(Tech, { sources: ['bundle-1.deps.js', 'bundle-2.deps.js'] })
            .then(target => {
                target.deps.must.eql([
                    { block: 'block-1' },
                    { block: 'block-2' }
                ]);
            });
    });

    it('must support deps as array', () => {
        mockFs({
            bundle: {}
        });

        const bundle = new TestNode('bundle');

        bundle.provideTechData('bundle-1.deps.js', [{ block: 'block-1' }]);
        bundle.provideTechData('bundle-2.deps.js', [{ block: 'block-2' }]);

        return bundle.runTech(Tech, { sources: ['bundle-1.deps.js', 'bundle-2.deps.js'] })
            .then(target => {
                target.deps.must.eql([
                    { block: 'block-1' },
                    { block: 'block-2' }
                ]);
            });
    });

    it('must provide result from cache', () => {
        mockFs({
            bundle: {
                'bundle.deps.js': `exports.deps = ${JSON.stringify([
                    { block: 'other-block' }
                ])};`,
                'bundle-1.deps.js': `exports.deps = ${JSON.stringify([{ block: 'block-1' }])};`,
                'bundle-2.deps.js': `exports.deps = ${JSON.stringify([{ block: 'block-2' }])};`
            }
        });

        const bundle = new TestNode('bundle');
        const cache = bundle.getNodeCache('bundle.deps.js');
        const sourcePath1 = path.resolve('bundle', 'bundle-1.deps.js');
        const sourcePath2 = path.resolve('bundle', 'bundle-2.deps.js');

        cache.cacheFileInfo('deps-file', path.resolve('bundle', 'bundle.deps.js'));
        cache.cacheFileInfo(sourcePath1, sourcePath1);
        cache.cacheFileInfo(sourcePath2, sourcePath2);

        return bundle.runTech(Tech, { sources: ['bundle-1.deps.js', 'bundle-2.deps.js'] })
            .then(target => {
                target.deps.must.eql([{ block: 'other-block' }]);
            });
    });

    it('must support BEMDECL', () => {
        const decl1 = [{ name: 'block-1' }];
        const decl2 = [{ name: 'block-2' }];

        const expected = [
            { block: 'block-1' },
            { block: 'block-2' }
        ];

        return assert([decl1, decl2], expected);
    });

    it('must merge block with mod of block', () => {
        const decl1 = [{ block: 'block' }];
        const decl2 = [{ block: 'block', mod: 'mod-name', val: 'mod-val' }];

        const expected = [
            { block: 'block' },
            { block: 'block', mod: 'mod-name', val: 'mod-val' }
        ];

        return assert([decl1, decl2], expected);
    });

    it('must merge block with elem', () => {
        const decl1 = [{ block: 'block' }];
        const decl2 = [{ block: 'block', elem: 'elem' }];

        const expected = [
            { block: 'block' },
            { block: 'block', elem: 'elem' }
        ];

        return assert([decl1, decl2], expected);
    });

    it('must merge elem with mod of elem', () => {
        const decl1 = [{ block: 'block', elem: 'elem' }];
        const decl2 = [{ block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }];

        const expected = [
            { block: 'block', elem: 'elem' },
            { block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }
        ];

        return assert([decl1, decl2], expected);
    });

    it('must merge elems of block', () => {
        const decl1 = [{ block: 'block', elem: 'elem-1' }];
        const decl2 = [{ block: 'block', elem: 'elem-2' }];

        const expected = [
            { block: 'block', elem: 'elem-1' },
            { block: 'block', elem: 'elem-2' }
        ];

        return assert([decl1, decl2], expected);
    });

    it('must merge set with empty set', () => {
        const decl1 = [];
        const decl2 = [{ block: '1' }, { block: '2' }, { block: '3' }];
        const expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

        return assert([decl1, decl2], expected);
    });

    it('must merge intersecting sets', () => {
        const decl1 = [{ block: '1' }, { block: '2' }, { block: '3' }];
        const decl2 = [{ block: '2' }];
        const expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

        return assert([decl1, decl2], expected);
    });

    it('must merge disjoint sets', () => {
        const decl1 = [{ block: '1' }, { block: '2' }, { block: '3' }];
        const decl2 = [{ block: 'O_o' }];
        const expected = [{ block: '1' }, { block: '2' }, { block: '3' }, { block: 'O_o' }];

        return assert([decl1, decl2], expected);
    });
});

function assert(sources, expected) {
    let bundle;
    const dir = {};
    const options = { sources: [] };

    sources.forEach((deps, i) => {
        const target = `${i}.deps.js`;
        const isBemdecl = !!deps && deps.length && deps[0].name;

        dir[target] = isBemdecl ? `exports.blocks = ${JSON.stringify(deps)};` :
            `exports.deps = ${JSON.stringify(deps)};`;
        options.sources.push(target);
    });

    mockFs({ bundle: dir });
    bundle = (new TestNode('bundle'));

    return vow.all([
            bundle.runTechAndGetResults(Tech, options),
            bundle.runTechAndRequire(Tech, options)
        ])
        .spread((target1, target2) => {
            target1['bundle.deps.js'].deps.must.eql(expected);
            target2[0].deps.must.eql(expected);
        });
}
