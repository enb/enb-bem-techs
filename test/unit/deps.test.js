var deps = require('../../lib/deps/deps');

describe('libs: deps', function () {
    it('must merge deps', function () {
        var firstDecl = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', elem: 'elem1' },
                {}
            ],
            secondDecl = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', mod: 'mod2' }
            ],
            output = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', elem: 'elem1' },
                {},
                { block: 'block1', mod: 'mod2' }
            ];

        deps.merge([firstDecl, secondDecl]).must.be.eql(output);
    });

    it('must substract deps', function () {
        var firstDecl = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', elem: 'elem1' }
            ],
            secondDecl = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', mod: 'mod2' }
            ],
            output = [
                { block: 'block1', elem: 'elem1' }
            ];

        deps.subtract(firstDecl, secondDecl).must.be.eql(output);
    });

    it('must intersect deps', function () {
        var firstDecl = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', mod: 'mod2', val: 'val2' }
            ],
            secondDecl = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod2', val: 'val2' },
                { block: 'block2', mod: 'mod1', val: 'val1' }
            ],
            output = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod2', val: 'val2' }
            ];

        deps.intersect([firstDecl, secondDecl]).must.be.eql(output);
    });

    it('must transform bemdecl to deps', function () {
        var input = [{
                name: 'block1',
                mods: [
                    { name: 'mod1', vals: [{ name: 'val1' }, { name: 'val2' }] },
                    { name: 'mod2' }
                ],
                elems: [
                    { name: 'elem1' },
                    { name: 'elem2', mods: [{ name: 'val3' }] },
                    { name: 'elem3', mods: [{ name: 'mod4', vals: [{ name: 'val4' }] }] }]
            }, {
                name: 'block2',
                mod: 'mod',
                elem: 'elem'
            }],
            output = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', mod: 'mod1', val: 'val2' },
                { block: 'block1', mod: 'mod2' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1', elem: 'elem2' },
                { block: 'block1', elem: 'elem2', mod: 'val3' },
                { block: 'block1', elem: 'elem3' },
                { block: 'block1', elem: 'elem3', mod: 'mod4', val: 'val4' },
                { block: 'block2' }
            ];

        deps.fromBemdecl(input).must.be.eql(output);
    });

    it('must return empty deps', function () {
        deps.fromBemdecl().must.be.eql([]);
    });

    it('must transform deps to bemdecl', function () {
        var input = [
                { block: 'block1' },
                { block: 'block1', mod: 'mod1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1', elem: 'elem1', mod: 'mod2' },
                { block: 'block1', elem: 'elem1', mod: 'mod2', val: 'val2' }
            ],
            output = [
                { name: 'block1' },
                { name: 'block1', mods: [{ name: 'mod1' }] },
                { name: 'block1', mods: [{ name: 'mod1', vals: [{ name: 'val1' }] }] },
                { name: 'block1', elems: [{ name: 'elem1' }] },
                { name: 'block1', elems: [{ name: 'elem1', mods: [{ name: 'mod2' }] }] },
                { name: 'block1', elems: [{ name: 'elem1', mods: [{ name: 'mod2', vals: [{ name: 'val2' }] }] }] }
            ];

        deps.toBemdecl(input).must.be.eql(output);
    });

    it('must return emty bemdecl', function () {
        deps.toBemdecl().must.be.eql([]);
    });

    it('must convert empty shortcut', function () {
        deps.flattenDep({}, 'block1').must.be.eql([{ block: 'block1' }]);
    });

    it('must convert shortcut given as string', function () {
        deps.flattenDeps('block1').must.be.eql([{ block: 'block1' }]);
    });

    it('must convert shortcuts', function () {
        var input = [
                { block: 'block1', elem: 'elem1', mods: { mod1: ['val1', 'val2'], mod2: 'val3' } },
                { block: 'block1', elem: 'elem1', mod: 'mod1', val: 'val2' },
                { block: 'block1', elem: 'elem1', mod: 'mod2' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1', mods: { mod1: ['val1', 'val2'], mod2: 'val3' } },
                { block: 'block1', elems: [{ elem: 'elem1', mods: { mod1: ['val1', 'val2'], mod2: 'val3' } }] },
                { block: 'block1', elems: ['elem1', 'elem2'] },
                { block: 'block1', elems: 'elem1' },
                { block: 'block1', elems: [{ elem: 'elem1', mods: undefined }] },
                { block: 'block1', mod: 'mod2', val: 'val3' },
                { block: 'block1', mod: 'mod2' },
                { block: 'block1', elems: 'elem1', tech: 'tech1' }
            ],
            output = [
                { block: 'block1', elem: 'elem1', mod: 'mod1', val: 'val1' },
                { block: 'block1', elem: 'elem1', mod: 'mod1', val: 'val2' },
                { block: 'block1', elem: 'elem1', mod: 'mod2', val: 'val3' },
                { block: 'block1', elem: 'elem1', mod: 'mod1', val: 'val2' },
                { block: 'block1', elem: 'elem1', mod: 'mod2' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1', mod: 'mod1', val: 'val1' },
                { block: 'block1', mod: 'mod1', val: 'val2' },
                { block: 'block1', mod: 'mod2', val: 'val3' },
                { block: 'block1' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1', elem: 'elem1', mod: 'mod1', val: 'val1' },
                { block: 'block1', elem: 'elem1', mod: 'mod1', val: 'val2' },
                { block: 'block1', elem: 'elem1', mod: 'mod2', val: 'val3' },
                { block: 'block1' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1', elem: 'elem2' },
                { block: 'block1' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1' },
                { block: 'block1', elem: 'elem1' },
                { block: 'block1', mod: 'mod2', val: 'val3' },
                { block: 'block1', mod: 'mod2' },
                { block: 'block1', tech: 'tech1' },
                { block: 'block1', elem: 'elem1', tech: 'tech1' }
            ];

        deps.flattenDeps(input).must.be.eql(output);
    });
});
