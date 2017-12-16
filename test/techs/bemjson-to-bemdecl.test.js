'use strict';

const path = require('path');
const vow = require('vow');
const mockFs = require('mock-fs');
const TestNode = require('mock-enb/lib/mock-node');
const Tech = require('../..').bemjsonToBemdecl;

describe('techs: bemjson-to-bemdecl', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('must support deps format', () => {
        const bemjson = { block: 'block' };
        const bemdecl = [{ block: 'block' }];

        return assert(bemjson, bemdecl, { bemdeclFormat: 'deps' });
    });

    it('must detect block', () => {
        const bemjson = { block: 'block' };
        const bemdecl = [{ name: 'block' }];

        return assert(bemjson, bemdecl);
    });

    it('must detect boolean mod of block', () => {
        const bemjson = { block: 'block', mods: { mod: true } };
        const bemdecl = [
            { name: 'block', mods: [{ name: 'mod', vals: [] }] }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect mod of block', () => {
        const bemjson = { block: 'block', mods: { 'mod-name': 'mod-val' } };
        const bemdecl = [
            { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect elem of block', () => {
        const bemjson = { block: 'block', elem: 'elem' };
        const bemdecl = [{ name: 'block', elems: [{ name: 'elem' }] }];

        return assert(bemjson, bemdecl);
    });

    it('must detect boolean mod of elem', () => {
        const bemjson = { block: 'block', elem: 'elem', elemMods: { mod: true } };
        const bemdecl = [
            { name: 'block', elems: [{ name: 'elem', mods: [{ name: 'mod', vals: [] }] }] }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect string mod of elem', () => {
        const bemjson = { block: 'block', elem: 'elem', elemMods: { 'mod-name': 'mod-val' } };
        const bemdecl = [
            { name: 'block', elems: [{ name: 'elem', mods: [
                { name: 'mod-name', vals: [{ name: 'mod-val' }] }]
            }] }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect block in custom field', () => {
        const bemjson = { custom: { block: 'block' } };
        const bemdecl = [{ name: 'block' }];

        return assert(bemjson, bemdecl);
    });

    it('must detect blocks in deep custom field', () => {
        const bemjson = {
            custom: {
                one: { block: 'block-1' },
                two: { block: 'block-2' }
            }
        };

        const bemdecl = [
            { name: 'block-1' },
            { name: 'block-2' }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must not detect block in attrs', () => {
        const bemjson = { attrs: { block: 'block' } };
        const bemdecl = [];

        return assert(bemjson, bemdecl);
    });

    it('must not detect block in js', () => {
        const bemjson = { js: { block: 'block' } };
        const bemdecl = [];

        return assert(bemjson, bemdecl);
    });

    it('must not fail when entity equals undefined', () => {
        const bemjson = [undefined];
        const bemdecl = [];

        return assert(bemjson, bemdecl);
    });

    it('must detect nested block', () => {
        const bemjson = {
            block: 'block-1',
            content: [
                { block: 'block-2' }
            ]
        };

        const bemdecl = [
            { name: 'block-1' },
            { name: 'block-2' }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect nested elem', () => {
        const bemjson = {
            block: 'block',
            content: [
                { elem: 'elem' }
            ]
        };

        const bemdecl = [
            { name: 'block', elems: [{ name: 'elem' }] }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect duplicate block', () => {
        const bemjson = [
            { block: 'block' },
            { block: 'block' }
        ];
        const bemdecl = [
            { name: 'block' }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect duplicate block', () => {
        const bemjson = [
            { block: 'block', elem: 'elem' },
            { block: 'block', elem: 'elem' }
        ];
        const bemdecl = [
            { name: 'block', elems: [{ name: 'elem' }] }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must detect duplicate mod of block', () => {
        const bemjson = [
            { block: 'block', mods: { 'mod-name': 'mod-val' } },
            { block: 'block', mods: { 'mod-name': 'mod-val' } }
        ];
        const bemdecl = [
            { name: 'block', mods: [{ name: 'mod-name', vals: [{ name: 'mod-val' }] }] }
        ];

        return assert(bemjson, bemdecl);
    });

    it('must provide result from cache', () => {
        const bemjson = [
            { block: 'block' }
        ];
        const bemdecl = [
            { name: 'other-block' }
        ];

        mockFs({
            bundle: {
                'bundle.bemjson.js': `(${JSON.stringify(bemjson)})`,
                'bundle.bemdecl.js': `exports.blocks = ${JSON.stringify(bemdecl)};`
            }
        });

        const bundle = new TestNode('bundle');
        const cache = bundle.getNodeCache('bundle.bemdecl.js');

        cache.cacheFileInfo('bemdecl-file', path.resolve('bundle/bundle.bemdecl.js'));
        cache.cacheFileInfo('bemjson-file', path.resolve('bundle/bundle.bemjson.js'));

        return bundle.runTechAndRequire(Tech)
            .then(target => {
                target[0].blocks.must.eql(bemdecl);
            });
    });
});

function assert(bemjson, bemdecl, options) {
    options || (options = {});

    mockFs({
        bundle: {
            'bundle.bemjson.js': `(${JSON.stringify(bemjson)})`
        }
    });

    const bundle = new TestNode('bundle');

    return vow.all([
            bundle.runTechAndGetResults(Tech, options),
            bundle.runTechAndRequire(Tech, options)
        ])
        .spread((data, target) => {
            const isDepsFormat = options.bemdeclFormat === 'deps';
            const actualDecl = isDepsFormat ? data['bundle.bemdecl.js'].deps : data['bundle.bemdecl.js'].blocks;
            const actualData = isDepsFormat ? target[0].deps : target[0].blocks;

            actualDecl.must.eql(bemdecl);
            actualData.must.eql(bemdecl);
        });
}
