var inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require'),
    deps = require('../lib/deps/deps');

/**
 * @class MergeBemdeclTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Merges BEMDECL files in one.
 *
 * It could be necessary to build the merged bundle.
 *
 * @param {Object}    options                          Options.
 * @param {String[]}  options.sources                  Paths to BEMDECL files for merge.
 * @param {String}    [options.target='?.bemdecl.js']  Path to merged BEMDECL file.
 *
 * @example
 * // Nodes in file system before build:
 * // merged-bundle/
 * // ├── bundle-1.bemdecl.js
 * // └── bundle-2.bemdecl.js
 * //
 * // After build:
 * // merged-bundle/
 * // ├── bundle-1.bemdecl.js
 * // ├── bundle-2.bemdecl.js
 * // └── merged-bundle.bemdecl.js
 *
 * var bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('merged-bundle', function(node) {
 *         node.addTech([bemTechs.mergeBemdecl, {
 *             sources: ['bundle-1.bemdecl.js', 'bundle-2.bemdecl.js'],
 *             target: 'merged-bundle.bemdecl.js'
 *         }]);
 *         node.addTarget('merged-bundle.bemdecl.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName: function () {
        return 'merge-bemdecl';
    },

    configure: function () {
        var _this = this,
            logger = this.node.getLogger();

        this._target = this.getOption('bemdeclTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem', this.getName(),
                'bemdeclTarget', 'target', ' It will be removed in v3.0.0.');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('bemdecl.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._sources = this.getOption('bemdeclSources');
        if (this._sources) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(),
                'bemdeclSources', 'sources', ' It will be removed in v3.0.0.');
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
            .then(function (sourceBemdecls) {
                var rebuildNeeded = cache.needRebuildFile('bemdecl-file', targetFilename);
                if (!rebuildNeeded) {
                    sourceFilenames.forEach(function (filename) {
                        if (cache.needRebuildFile(filename, filename)) {
                            rebuildNeeded = true;
                        }
                    });
                }
                if (rebuildNeeded) {
                    return vow.all(sourceBemdecls.map(function (bemdecl, i) {
                            if (bemdecl) { return deps.fromBemdecl(bemdecl.blocks); }

                            var filename = sourceFilenames[i];

                            clearRequire(filename);
                            return asyncRequire(filename)
                                .then(function (result) {
                                    return deps.fromBemdecl(result.blocks);
                                });
                        }))
                        .then(function (sourceDeps) {
                            var mergedDeps = deps.merge(sourceDeps),
                                mergedBemdecl = deps.toBemdecl(mergedDeps),
                                str = 'exports.blocks = ' + JSON.stringify(mergedBemdecl, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('bemdecl-file', targetFilename);
                                    sourceFilenames.forEach(function (filename) {
                                        cache.cacheFileInfo(filename, filename);
                                    });
                                    _this.node.resolveTarget(target, { blocks: mergedBemdecl });
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
