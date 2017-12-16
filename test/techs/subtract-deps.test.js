'use strict';

const path = require('path');
const vow = require('vow');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const Tech = require('../..').subtractDeps;

describe('techs: subtract-deps', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must provide result from cache', () => {
        mockFs({
            bundle: {
                'bundle.deps.js': `exports.deps = ${JSON.stringify([{ block: 'other-block' }])};`,
                'bundle-1.deps.js': `exports.deps = ${JSON.stringify([{ block: 'block-1' }])};`,
                'bundle-2.deps.js': `exports.deps = ${JSON.stringify([{ block: 'block-1' }])};`
            }
        });

        const bundle = new TestNode('bundle');
        const cache = bundle.getNodeCache('bundle.deps.js');

        cache.cacheFileInfo('deps-file', path.resolve('bundle/bundle.deps.js'));
        cache.cacheFileInfo('deps-from-file', path.resolve('bundle/bundle-1.deps.js'));
        cache.cacheFileInfo('deps-what-file', path.resolve('bundle/bundle-2.deps.js'));

        return bundle.runTech(Tech, { from: 'bundle-1.deps.js', what: 'bundle-2.deps.js' })
            .then(target => {
                target.deps.must.eql([{ block: 'other-block' }]);
            });
    });

    it('must support deps as array', () => {
        mockFs({
            bundle: {}
        });

        const bundle = new TestNode('bundle');

        bundle.provideTechData('bundle-1.deps.js', [{ block: 'block' }]);
        bundle.provideTechData('bundle-2.deps.js', [{ block: 'block' }]);

        return bundle.runTech(Tech, { from: 'bundle-1.deps.js', what: 'bundle-2.deps.js' })
            .then(target => {
                target.deps.must.eql([]);
            });
    });

    it('must subtract block from block', () => {
        const from = [{ block: 'block' }];
        const what = [{ block: 'block' }];
        const expected = [];

        return assert(from, what, expected);
    });

    it('must subtract elem from block', () => {
        const from = [{ block: 'block' }];
        const what = [{ block: 'block', elem: 'elem' }];
        const expected = [{ block: 'block' }];

        return assert(from, what, expected);
    });

    it('must subtract mod of block from block', () => {
        const from = [{ block: 'block' }];
        const what = [{ block: 'block', mod: 'mod-name', val: 'mod-val' }];
        const expected = [{ block: 'block' }];

        return assert(from, what, expected);
    });

    it('must subtract elem from elem', () => {
        const from = [{ block: 'block', elem: 'elem' }];
        const what = [{ block: 'block', elem: 'elem' }];
        const expected = [];

        return assert(from, what, expected);
    });

    it('must subtract mod of elem from elem', () => {
        const from = [{ block: 'block', elem: 'elem' }];
        const what = [{ block: 'block', elem: 'elem', mod: 'mod-name', val: 'mod-val' }];
        const expected = [{ block: 'block', elem: 'elem' }];

        return assert(from, what, expected);
    });

    it('must subtract nonexistent item from set', () => {
        const from = [{ block: '1' }, { block: '2' }, { block: '3' }];
        const what = [{ block: 'O_o' }];
        const expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

        return assert(from, what, expected);
    });

    it('must subtract empty set from nonempty set', () => {
        const from = [{ block: '1' }, { block: '2' }, { block: '3' }];
        const what = [];
        const expected = [{ block: '1' }, { block: '2' }, { block: '3' }];

        return assert(from, what, expected);
    });

    it('must subtract set from empty set', () => {
        const from = [];
        const what = [{ block: '1' }, { block: '2' }, { block: '3' }];
        const expected = [];

        return assert(from, what, expected);
    });

    it('must subtract disjoint set', () => {
        const from = [{ block: '1' }, { block: '2' }, { block: '3' }];
        const what = [{ block: '2' }];
        const expected = [{ block: '1' }, { block: '3' }];

        return assert(from, what, expected);
    });
});

function assert(from, what, expected) {
    mockFs({
        'fs-bundle': {
            'from.deps.js': `exports.deps = ${JSON.stringify(from)};`,
            'what.deps.js': `exports.deps = ${JSON.stringify(what)};`
        },
        'data-bundle': {}
    });

    const fsBundle = new TestNode('fs-bundle');
    const dataBundle = (new TestNode('data-bundle'));
    const options = { from: 'from.deps.js', what: 'what.deps.js' };

    dataBundle.provideTechData('from.deps.js', { deps: from });
    dataBundle.provideTechData('what.deps.js', { deps: what });

    return vow.all([
            fsBundle.runTechAndGetResults(Tech, options),
            fsBundle.runTechAndRequire(Tech, options),
            dataBundle.runTechAndGetResults(Tech, options),
            dataBundle.runTechAndRequire(Tech, options)
        ])
        .spread((data1, target1, data2, target2) => {
            data1['fs-bundle.deps.js'].deps.must.eql(expected);
            target1[0].deps.must.eql(expected);
            data2['data-bundle.deps.js'].deps.must.eql(expected);
            target2[0].deps.must.eql(expected);
        });
}
