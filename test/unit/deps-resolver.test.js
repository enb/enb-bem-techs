var DepsResolver = require('../../lib/deps/deps-resolver'),
    mock = require('mock-fs');

describe('libs: deps-resolver', function () {
    after(function () {
        mock.restore();
    });

    it('must resolve mod required ordered block. issue#203', function () {
        return createGraph({
            x: {
                mustDeps: { mod: 'must-mod' },
                shouldDeps: { mod: 'should-mod' }
            }
        })
        .dependenciesOf({ block: 'x' })
        .must.eventually.equal([
            { block: 'x', mod: 'must-mod' },
            { block: 'x' },
            { block: 'x', mod: 'should-mod' }
        ]);
    });

    it('must resolve elem that required ordered block', function () {
        return createGraph({
            x: {
                mustDeps: { elem: 'must-elem' },
                shouldDeps: { elem: 'should-elem' }
            }
        })
        .dependenciesOf({ block: 'x' })
        .must.eventually.equal([
            { block: 'x', elem: 'must-elem' },
            { block: 'x' },
            { block: 'x', elem: 'should-elem' }
        ]);
    });
});

function createGraph(entitiesData) {
    var files = Object.keys(entitiesData).reduce(function (res, k) {
        res[k + '.deps.js'] = '(' + JSON.stringify(entitiesData[k]) + ')';
        return res;
    }, {});
    mock(files);

    var resolver = new DepsResolver({
        getBlockFiles: function (b, m, v) {
            var name = b + (m ? '_' + m : '') + (v ? '_' + v : '') + '.deps.js';
            return files[name] ? [{ name: name, fullname: name, suffix: 'deps.js' }] : [];
        },
        getElemFiles: function (b, e, m, v) {
            var name = b + '__' + e + (m ? '_' + m : '') + (v ? '_' + v : '') + '.deps.js';
            return files[name] ? [{ name: name, fullname: name, suffix: 'deps.js' }] : [];
        }
    });

    return {
        dependenciesOf: function (decl) {
            decl = resolver.normalizeDeps(decl);
            return resolver.addDecls(decl).then(function () {
                return resolver.resolve();
            });
        }
    };
}
