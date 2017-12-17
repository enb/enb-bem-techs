'use strict';

const inherit = require('inherit');
const enb = require('enb');
const vfs = enb.asyncFS || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');
const bemDecl = require('@bem/sdk.decl');

/**
 * @class LevelsToBemdeclTech
 * @augments {BaseTech}
 * @see {@link Levels}
 * @classdesc
 *
 * Builds BEMDECL file with BEM entities from specified levels.
 *
 * @param {Object}  [options]                         Options.
 * @param {String}  [options.target='?.bemdecl.js']   Path to result BEMDECL file.
 * @param {String}  [options.source='?.levels']       Path to target with {@link Levels}.
 * @param {String}  [options.bemdeclFormat='bemdecl'] Format of result declaration (bemdecl or deps).
 *
 * @example
 * var bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // scan levels
 *         node.addTech([bemTechs.levels, { levels: ['blocks'] }]);
 *
 *         // build BEMDECL file
 *         node.addTech(bemTechs.levelsToBemdecl);
 *         node.addTarget('?.bemdecl.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName() {
        return 'levels-to-bemdecl';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', node.getTargetName('bemdecl.js')));
        this._source = node.unmaskTargetName(this.getOption('source', node.getTargetName('levels')));
        this._bemdeclFormat = this.getOption('bemdeclFormat', 'bemdecl');
    },

    getTargets() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build() {
        const node = this.node;
        const target = this._target;
        const bemdeclFilename = node.resolvePath(target);
        const bemdeclFormat = this._bemdeclFormat;
        const cache = node.getNodeCache(target);

        return node.requireSources([this._source]).spread(introspection => {
            const resDeps = introspection.getEntities().map(entity => {
                const dep = { block: entity.block };

                entity.elem && (dep.elem = entity.elem);
                entity.modName && (dep.mod = entity.modName);
                entity.modVal && (dep.val = entity.modVal);

                return dep;
            });

            let data;
            let str;

            if (bemdeclFormat === 'deps') {
                data = { deps: resDeps };
                str = `exports.deps = ${JSON.stringify(resDeps, null, 4)};\n`;
            } else {
                const cells = bemDecl.parse({ deps: resDeps });
                const decl = bemDecl.format(cells, { format: 'v1' });

                data = { blocks: decl };
                str = `exports.blocks = ${JSON.stringify(decl, null, 4)};\n`;
            }

            if (cache.get('bemdecl') !== str || cache.needRebuildFile('bemdecl-file', bemdeclFilename)) {
                return vfs.write(bemdeclFilename, str, 'utf8')
                    .then(() => {
                        cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                        cache.set('bemdecl', str);
                        node.resolveTarget(target, data);
                    });
            }

            node.isValidTarget(target);
            node.resolveTarget(target, data);
        });
    }
});
