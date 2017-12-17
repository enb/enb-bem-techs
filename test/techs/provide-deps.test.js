'use strict';

const path = require('path');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const Tech = require('../..').provideDeps;

describe('techs: provide-deps', () => {
    let bundle;
    const deps = [{ block: 'block' }];

    beforeEach(() => {
        mockFs({
            'fs-bundle': {
                'fs-bundle.deps.js': `exports.deps = ${JSON.stringify(deps)};`
            },
            'data-bundle': {},
            bundle: {}
        });

        bundle = new TestNode('bundle');
        bundle.provideNodeTechData('data-bundle', 'data-bundle.deps.js', { deps });
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('must provide `?.deps.js` target from file', () => {
        return bundle.runTech(Tech, {
                node: 'fs-bundle',
                source: 'fs-bundle.deps.js'
            })
            .then(res => res.deps.must.eql(deps));
    });

    it('must provide `?.deps.js` target from data', () => {
        return bundle.runTech(Tech, {
                node: 'data-bundle',
                source: 'data-bundle.deps.js'
            })
            .then(res => res.deps.must.eql(deps));
    });

    it('must require `?.deps.js` target from file', () => {
        return bundle.runTechAndRequire(Tech, {
                node: 'fs-bundle',
                source: 'fs-bundle.deps.js'
            })
            .spread(res => res.deps.must.eql(deps));
        });

    it('must require `?.deps.js` target from data', () => {
        return bundle.runTechAndRequire(Tech, {
            node: 'data-bundle',
            source: 'data-bundle.deps.js'
        })
        .spread(res => res.deps.must.eql(deps));
    });

    it('must provide result from cache', () => {
        mockFs({
            'bundle-1': {
                'bundle-1.deps.js': `exports.deps = ${JSON.stringify([{ block: 'block' }])};`
            },
            'bundle-2': {
                'bundle-2.deps.js': `exports.deps = ${JSON.stringify([{ block: 'other-block' }])};`
            }
        });

        const bundle2 = new TestNode('bundle-2');
        const cache = bundle2.getNodeCache('bundle-2.deps.js');

        cache.cacheFileInfo('deps-source-file', path.resolve('bundle-1/bundle-1.deps.js'));
        cache.cacheFileInfo('deps-file', path.resolve('bundle-2/bundle-2.deps.js'));

        return bundle2.runTech(Tech, { node: 'bundle-1' })
            .then(target => {
                target.deps.must.eql([{ block: 'other-block' }]);
            });
    });
});
