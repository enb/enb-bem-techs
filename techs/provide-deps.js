var inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require');

/**
 * @class ProvideDepsTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Copies DEPS file in current node with specified name from specified node.
 *
 * It could be necessary to merge DEPS files from different nodes.
 *
 * @param {Object}  options                         Options.
 * @param {String}  options.node                    Path to node with DEPS file.
 * @param {String}  [options.source=?.bemdecl.js]   Path to source DEPS file (unmasked by `options.node`).
 * @param {String}  [options.target=?.bemdecl.js]   Path to result DEPS file (unmasked by current node).
 *
 * @example
 * // Nodes in file system before build:
 * //
 * // bundles/
 * // ├── bundle-1/
 * //    └── bundle-1.deps.js
 * // ├── bundle-2/
 * //    └── bundle-1.deps.js
 * // └── bundle-3/
 * //
 * // After build:
 * // bundles/
 * // ├── bundle-1/
 * //    └── bundle-1.deps.js
 * // ├── bundle-2/
 * //    └── bundle-2.deps.js
 * // └── bundle-3/
 * //    ├── bundle-1.deps.js
 * //    └── bundle-2.deps.js
 *
 * var bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle-3', function(node) {
 *         node.addTechs([
 *             // Copy DEPS file from `bundle-1` to `bundle-3` node
 *             [bemTechs.provideDeps, {
 *                 node: 'bundles/bundle-1',
 *                 source: 'bundle-1.deps.js',
 *                 target: 'bundle-1.deps.js'
 *             }],
 *
 *             // Copy DEPS file from `bundle-2` to `bundle-3` node
 *             [bemTechs.provideDeps, {
 *                 node: 'bundles/bundle-2',
 *                 source: 'bundle-1.deps.js',
 *                 target: 'bundle-2.deps.js'
 *             }]
 *         ]);
 *         node.addTargets([
 *             'bundle-1.deps.js',
 *             'bundle-2.deps.js'
 *         ]);
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName: function () {
        return 'provide-deps';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._target = this.getOption('depsTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem-techs', this.getName(),
                'depsTarget', 'target', ' It will be removed in v3.0.0.');
        } else {
            this._target = this.getOption('target', '?.deps.js');
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._fromNode = this.getOption('sourceNodePath');
        if (this._fromNode) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(),
                'sourceNodePath', 'node', ' It will be removed in v3.0.0.');
        } else {
            this._fromNode = this.getRequiredOption('node');
        }

        this._sourceTarget = this.getOption('sourceTarget');
        if (this._sourceTarget) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(),
                'sourceTarget', 'source', ' It will be removed in v3.0.0.');
        } else {
            this._sourceTarget = this.getOption('source', '?.deps.js');
        }
        this._sourceTarget = this.node.unmaskNodeTargetName(this._fromNode, this._sourceTarget);
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            fromNode = this._fromNode,
            sourceTarget = this._sourceTarget,
            targetFilename = node.resolvePath(target),
            sourceFilename = node.resolveNodePath(fromNode, sourceTarget),
            cache = node.getNodeCache(target),
            requirements = {};

        requirements[fromNode] = [sourceTarget];

        return this.node.requireNodeSources(requirements)
            .then(function (results) {
                var preDeps = results[fromNode][0];

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('deps-source-file', sourceFilename)
                ) {
                    return requireDeps(preDeps, sourceFilename)
                        .then(function (res) {
                            var deps = Array.isArray(res) ? res : res.deps,
                                str = 'exports.deps = ' + JSON.stringify(deps, null, 4) + ';\n';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileInfo('deps-source-file', sourceFilename);
                                    node.resolveTarget(target, { deps: deps });
                                });
                        });
                } else {
                    node.isValidTarget(target);

                    return requireDeps(null, targetFilename)
                        .then(function (resDeps) {
                            node.resolveTarget(target, resDeps);
                            return null;
                        });
                }
            });
    }
});

function requireDeps(data, filename) {
    if (data) { return vow.resolve(data); }

    clearRequire(filename);
    return asyncRequire(filename);
}
