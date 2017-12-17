'use strict';

const inherit = require('inherit');
const vow = require('vow');
const enb = require('enb');
const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const fileEval = require('file-eval');
const bemDecl = require('@bem/sdk.decl');

/**
 * @class SubtractDepsTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds DEPS file subtracting one file from another.
 *
 * @param {Object}  options                         Options.
 * @param {String}  options.from                    Path to DEPS file from which is subtracted.
 * @param {String}  options.what                    Path to DEPS file that is subtracted.
 * @param {String}  [options.target=?.deps.js]      Path to result DEPS file.
 *
 * @example
 * // Nodes in file system before build:
 * //
 * // bundle/
 * // ├── bundle-1.deps.js
 * // └── bundle-2.deps.js
 * //
 * // After build:
 * // bundle/
 * // ├── bundle-1.deps.js
 * // ├── bundle-2.deps.js
 * // └── bundle.deps.js
 *
 * var bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         node.addTech([bemTechs.subtractDeps, {
 *             from: 'bundle-1.deps.js',
 *             what: 'bundle-2.deps.js',
 *             target: 'bundle.deps.js'
 *         }]);
 *         node.addTarget('bundle.deps.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName() {
        return 'subtract-deps';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', '?.deps.js'));
        this._fromTarget = node.unmaskTargetName(this.getRequiredOption('from'));
        this._whatTarget = node.unmaskTargetName(this.getRequiredOption('what'));
    },

    getTargets() {
        return [this._target];
    },

    build() {
        const node = this.node;
        const target = this._target;
        const cache = node.getNodeCache(target);
        const targetFilename = node.resolvePath(target);
        const fromFilename = node.resolvePath(this._fromTarget);
        const whatFilename = node.resolvePath(this._whatTarget);

        return this.node.requireSources([this._fromTarget, this._whatTarget])
            .spread((sourceFromDeps, sourceWhatDeps) => {
                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('deps-from-file', fromFilename) ||
                    cache.needRebuildFile('deps-what-file', whatFilename)
                ) {
                    return vow.all([
                            requireDeps(sourceFromDeps, fromFilename),
                            requireDeps(sourceWhatDeps, whatFilename)
                        ])
                        .spread((from, what) => {
                            const fromDeps = Array.isArray(from) ? { deps: from } : from;
                            const whatDeps = Array.isArray(what) ? { deps: what } : what;
                            const fromCells = bemDecl.parse(fromDeps);
                            const whatCells = bemDecl.parse(whatDeps);
                            const subtractedCells = bemDecl.subtract(fromCells, whatCells);
                            const data = bemDecl.format(subtractedCells, { format: 'enb' });
                            const str = `module.exports = ${JSON.stringify(data, null, 4)};`;

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(() => {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileInfo('deps-from-file', fromFilename);
                                    cache.cacheFileInfo('deps-what-file', whatFilename);
                                    node.resolveTarget(target, data);
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

function requireDeps(deps, filename) {
    if (deps) { return deps; }

    return fileEval(filename);
}
