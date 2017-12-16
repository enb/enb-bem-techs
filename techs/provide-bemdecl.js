'use strict';

const inherit = require('inherit');
const vow = require('vow');
const enb = require('enb');
const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const fileEval = require('file-eval');

/**
 * @class ProvideBemdeclTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Copies BEMDECL file in current node with specified name from specified node.
 *
 * It could be necessary to merge BEMDECL files from different nodes.
 *
 * @param {Object}  options                         Options.
 * @param {String}  options.node                    Path to node with BEMDECL file.
 * @param {String}  [options.source=?.bemdecl.js]   Path to source BEMDECL file (unmasked by `options.node`).
 * @param {String}  [options.target=?.bemdecl.js]   Path to result BEMDECL file (unmasked by current node).
 *
 * @example
 * // Nodes in file system before build:
 * //
 * // bundles/
 * // ├── bundle-1/
 * //    └── bundle-1.bemdecl.js
 * // ├── bundle-2/
 * //    └── bundle-1.bemdecl.js
 * // └── bundle-3/
 * //
 * // After build:
 * // bundles/
 * // ├── bundle-1/
 * //    └── bundle-1.bemdecl.js
 * // ├── bundle-2/
 * //    └── bundle-2.bemdecl.js
 * // └── bundle-3/
 * //    ├── bundle-1.bemdecl.js
 * //    └── bundle-2.bemdecl.js
 *
 * var bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle-3', function(node) {
 *         node.addTechs([
 *             // Copy BEMDECL file from `bundle-1` to `bundle-3` node
 *             [bemTechs.provideBemdecl, {
 *                 node: 'bundles/bundle-1',
 *                 source: 'bundle-1.bemdecl.js',
 *                 target: 'bundle-1.bemdecl.js'
 *             }],
 *
 *             // Copy BEMDECL file from `bundle-2` to `bundle-3` node
 *             [bemTechs.provideBemdecl, {
 *                 node: 'bundles/bundle-2',
 *                 source: 'bundle-1.bemdecl.js',
 *                 target: 'bundle-2.bemdecl.js'
 *             }]
 *         ]);
 *         node.addTargets([
 *             'bundle-1.bemdecl.js',
 *             'bundle-2.bemdecl.js'
 *         ]);
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName() {
        return 'provide-bemdecl';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', '?.bemdecl.js'));
        this._fromNode = this.getRequiredOption('node');
        this._sourceTarget = node.unmaskNodeTargetName(this._fromNode, this.getOption('source', '?.bemdecl.js'));
    },

    getTargets() {
        return [this._target];
    },

    build() {
        const node = this.node;
        const target = this._target;
        const fromNode = this._fromNode;
        const sourceTarget = this._sourceTarget;
        const targetFilename = node.resolvePath(target);
        const sourceFilename = node.resolveNodePath(fromNode, sourceTarget);
        const cache = node.getNodeCache(target);
        const requirements = {};

        requirements[fromNode] = [sourceTarget];

        return node.requireNodeSources(requirements)
            .then(results => {
                const preBemdecl = results[fromNode][0];

                if (cache.needRebuildFile('bemdecl-file', targetFilename) ||
                    cache.needRebuildFile('bemdecl-source-file', sourceFilename)
                ) {
                    return requireBemdecl(preBemdecl, sourceFilename)
                        .then(resBemdecl => {
                        const blocks = resBemdecl.blocks;
                        const str = `exports.blocks = ${JSON.stringify(blocks, null, 4)};\n`;

                        return vfs.write(targetFilename, str, 'utf-8')
                            .then(() => {
                                cache.cacheFileInfo('bemdecl-file', targetFilename);
                                cache.cacheFileInfo('bemdecl-source-file', sourceFilename);
                                node.resolveTarget(target, { blocks });
                            });
                    });
                } else {
                    node.isValidTarget(target);

                    return requireBemdecl(null, targetFilename)
                        .then(resBemdecl => {
                            node.resolveTarget(target, resBemdecl);
                            return null;
                        });
                }
            });
    }
});

function requireBemdecl(data, filename) {
    if (data) { return vow.resolve(data); }

    return fileEval(filename);
}
