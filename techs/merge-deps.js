var inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require'),
    deps = require('../lib/deps/deps');

/**
 * @class MergeDepsTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Merges DEPS files and BEMDECL files in one.
 *
 * It could be necessary to build the merged bundle.
 *
 * @param {Object}    options                          Options.
 * @param {String[]}  options.sources                  Paths to DEPS or BEMDECL files for merge.
 * @param {String}    [options.target='?.bemdecl.js']  Path to merged DEPS file.
 *
 * @example
 * // Nodes in file system before build:
 * // merged-bundle/
 * // ├── bundle-1.deps.js
 * // └── bundle-2.deps.js
 * //
 * // After build:
 * // merged-bundle/
 * // ├── bundle-1.deps.js
 * // ├── bundle-2.deps.js
 * // └── merged-bundle.deps.js
 *
 * var bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('merged-bundle', function(node) {
 *         node.addTech([bemTechs.mergeDeps, {
 *             sources: ['bundle-1.deps.js', 'bundle-2.deps.js'],
 *             target: 'merged-bundle.deps.js'
 *         }]);
 *         node.addTarget('merged-bundle.deps.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName: function () {
        return 'merge-deps';
    },

    configure: function () {
        var _this = this,
            logger = this.node.getLogger();

        this._target = this.getOption('depsTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem', this.getName(),
                'depsTarget', 'target', ' It will be removed in v3.0.0.');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('deps.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._sources = this.getOption('depsSources');
        if (this._sources) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(),
                'depsSources', 'sources', ' It will be removed in v3.0.0.');
        } else {
            this._sources = this.getRequiredOption('sources');
        }
        this._sources = this._sources.map(function (source) {
            return _this.node.unmaskTargetName(source);
        });
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this,
            node = this.node,
            target = this._target,
            sources = this._sources,
            cache = node.getNodeCache(target),
            targetFilename = node.resolvePath(target),
            sourceFilenames = sources.map(function (sourceTarget) {
                return node.resolvePath(sourceTarget);
            });

        return this.node.requireSources(sources)
            .then(function (sourceDeps) {
                var rebuildNeeded = cache.needRebuildFile('deps-file', targetFilename);

                if (!rebuildNeeded) {
                    sourceFilenames.forEach(function (filename) {
                        if (cache.needRebuildFile(filename, filename)) {
                            rebuildNeeded = true;
                        }
                    });
                }

                if (rebuildNeeded) {
                    return vow.all(sourceDeps.map(function (source, i) {
                            if (source) {
                                return getDeps(source);
                            }

                            var filename = sourceFilenames[i];

                            clearRequire(filename);
                            return asyncRequire(filename)
                                .then(function (res) {
                                    return getDeps(res);
                                });
                        }))
                        .then(function (sourceDeps) {
                            var mergedDeps = deps.merge(sourceDeps),
                                str = 'exports.deps = ' + JSON.stringify(mergedDeps, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    sourceFilenames.forEach(function (filename) {
                                        cache.cacheFileInfo(filename, filename);
                                    });
                                    _this.node.resolveTarget(target, { deps: mergedDeps });
                                });
                        });
                } else {
                    node.isValidTarget(target);
                    clearRequire(targetFilename);

                    return asyncRequire(targetFilename)
                        .then(function (result) {
                            node.resolveTarget(target, result);
                            return null;
                        });
                }
            });
    }
});

function getDeps(source) {
    if (source.blocks) {
        return deps.fromBemdecl(source.blocks);
    }

    return Array.isArray(source) ? source : source.deps;
}
