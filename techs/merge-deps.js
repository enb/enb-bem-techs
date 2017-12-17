'use strict';

const inherit = require('inherit');
const vow = require('vow');
const enb = require('enb');
const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const fileEval = require('file-eval');
const bemDecl = require('@bem/sdk.decl');

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
    getName() {
        return 'merge-deps';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', node.getTargetName('deps.js')));
        this._sources = this.getRequiredOption('sources').map(source => node.unmaskTargetName(source));
    },

    getTargets() {
        return [this._target];
    },

    build() {
        const _this = this;
        const node = this.node;
        const target = this._target;
        const sources = this._sources;
        const cache = node.getNodeCache(target);
        const targetFilename = node.resolvePath(target);
        const sourceFilenames = sources.map(sourceTarget => node.resolvePath(sourceTarget));

        return this.node.requireSources(sources)
            .then(sourceDeps => {
                let rebuildNeeded = cache.needRebuildFile('deps-file', targetFilename);

                if (!rebuildNeeded) {
                    sourceFilenames.forEach(filename => {
                        if (cache.needRebuildFile(filename, filename)) {
                            rebuildNeeded = true;
                        }
                    });
                }

                if (rebuildNeeded) {
                    return vow.all(sourceDeps.map((source, i) => {
                            if (source) {
                                return getDeps(source);
                            }

                            const filename = sourceFilenames[i];

                            return fileEval(filename)
                                .then(res => getDeps(res));
                        }))
                        .then(decls => {
                            const mergedCells = bemDecl.merge.apply(null, decls);
                            const data = bemDecl.format(mergedCells, { format: 'enb' });
                            const str = `module.exports = ${JSON.stringify(data, null, 4)};`;

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(() => {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    sourceFilenames.forEach(filename => {
                                        cache.cacheFileInfo(filename, filename);
                                    });
                                    _this.node.resolveTarget(target, data);
                                });
                    });
                } else {
                    node.isValidTarget(target);

                    return fileEval(targetFilename)
                        .then(result => {
                            node.resolveTarget(target, result);
                            return null;
                        });
                }
            });
    }
});

function getDeps(source) {
    if (Array.isArray(source)) {
        return bemDecl.parse({ deps: source });
    }

    return bemDecl.parse(source);
}
