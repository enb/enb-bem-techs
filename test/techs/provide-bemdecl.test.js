'use strict';

const path = require('path');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const Tech = require('../..').provideBemdecl;

describe('techs: provide-deps', () => {
    let bundle;
    const bemdecl = [{ name: 'block' }];

    beforeEach(() => {
        mockFs({
            'fs-bundle': {
                'fs-bundle.bemdecl.js': `exports.blocks = ${JSON.stringify(bemdecl)};`
            },
            'data-bundle': {},
            bundle: {}
        });

        bundle = new TestNode('bundle');
        bundle.provideNodeTechData('data-bundle', 'data-bundle.bemdecl.js', { blocks: bemdecl });
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('must provide `?.bemdecl.js` target from file', () => bundle.runTech(Tech, {
            node: 'fs-bundle',
            source: 'fs-bundle.bemdecl.js'
        })
        .then(res => {
            res.blocks.must.eql(bemdecl);
        }));

    it('must provide `?.bemdecl.js` target from data', () => bundle.runTech(Tech, {
            node: 'data-bundle',
            source: 'data-bundle.bemdecl.js'
        })
        .then(res => {
            res.blocks.must.eql(bemdecl);
        }));

    it('must require `?.bemdecl.js` target from file', () => {
        return bundle.runTechAndRequire(Tech, {
                node: 'fs-bundle',
                source: 'fs-bundle.bemdecl.js'
            })
            .spread(res => {
                res.blocks.must.eql(bemdecl);
            });
    });

    it('must require `?.deps.js` target from data', () => {
        return bundle.runTechAndRequire(Tech, {
                node: 'data-bundle',
                source: 'data-bundle.bemdecl.js'
            })
            .spread(res => {
                res.blocks.must.eql(bemdecl);
            });
    });

    it('must provide result from cache', () => {
        mockFs({
            'bundle-1': {
                'bundle-1.bemdecl.js': `exports.blocks = ${JSON.stringify([{ block: 'block' }])};`
            },
            'bundle-2': {
                'bundle-2.bemdecl.js': `exports.blocks = ${JSON.stringify([{ block: 'other-block' }])};`
            }
        });

        const bundle2 = new TestNode('bundle-2');
        const cache = bundle2.getNodeCache('bundle-2.bemdecl.js');

        cache.cacheFileInfo('bemdecl-source-file', path.resolve('bundle-1/bundle-1.bemdecl.js'));
        cache.cacheFileInfo('bemdecl-file', path.resolve('bundle-2/bundle-2.bemdecl.js'));

        return bundle2.runTech(Tech, { node: 'bundle-1' })
            .then(target => {
                target.blocks.must.eql([{ block: 'other-block' }]);
            });
    });
});
