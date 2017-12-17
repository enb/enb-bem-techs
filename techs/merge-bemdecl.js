'use strict';

const inherit = require('inherit');
const vow = require('vow');
const enb = require('enb');
const fileEval = require('file-eval');
const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const bemDecl = require('@bem/sdk.decl');

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
    getName() {
        return 'merge-bemdecl';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', node.getTargetName('bemdecl.js')));
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
            .then(sourceBemdecls => {
                let rebuildNeeded = cache.needRebuildFile('bemdecl-file', targetFilename);
                if (!rebuildNeeded) {
                    sourceFilenames.forEach(filename => {
                        if (cache.needRebuildFile(filename, filename)) {
                            rebuildNeeded = true;
                        }
                    });
                }
                if (rebuildNeeded) {
                    return vow.all(sourceBemdecls.map((bemdecl, i) => {
                            if (bemdecl) { return bemDecl.parse(bemdecl); }

                            const filename = sourceFilenames[i];

                            return fileEval(filename)
                                .then(result => bemDecl.parse(result));
                        }))
                        .then(decls => {
                            const mergedCells = bemDecl.merge.apply(null, decls);
                            const data = bemDecl.format(mergedCells, { format: 'v1' });
                            const str = `exports.blocks = ${JSON.stringify(data, null, 4)};`;

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(() => {
                                    cache.cacheFileInfo('bemdecl-file', targetFilename);
                                    sourceFilenames.forEach(filename => {
                                        cache.cacheFileInfo(filename, filename);
                                    });
                                    _this.node.resolveTarget(target, { blocks: data });
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
