'use strict';

const inherit = require('inherit');
const vow = require('vow');
const enb = require('enb');
const fileEval = require('file-eval');
const bemDeps = require('@bem/sdk.deps');
const bemDecl = require('@bem/sdk.decl');
const vfs = enb.asyncFs || require('enb/lib/fs/async-fs');
const BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');

/**
 * @class DepsTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Supplements declaration of BEM entities using information about dependencies in `deps.js` or
 * `deps.yaml` (not supported yet) files.
 *
 * @param {Object}  [options]                             Options.
 * @param {String}  [options.target=?.deps.js]            Path to built file with completed declaration of BEM entities.
 * @param {String}  [options.levelsTarget=?.levels]       Path to target with {@link Levels}.
 * @param {String}  [options.bemdeclFile='?.bemdecl.js']  Path to file with declaration of BEM entities.
 *
 * @example
 * var FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // scan levels
 *         node.addTech([bemTechs.levels, { levels: ['blocks'] }]);
 *
 *         // get BEMDECL file
 *         node.addTech([FileProvideTech, { target: '?.bemdecl.js' }]);
 *
 *         // build DEPS file
 *         node.addTech([bemTechs.deps, {
 *             target: '?.deps.js',
 *             bemdeclFile: '?.bemdecl.js'
 *         }]);
 *         node.addTarget('?.deps.js');
 *     });
 * };
 */
module.exports = inherit(BaseTech, {
    getName() {
        return 'deps';
    },

    configure() {
        const node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', node.getTargetName('deps.js')));
        this._declFile = node.unmaskTargetName(this.getOption('bemdeclFile', node.getTargetName('bemdecl.js')));
        this._levelsTarget = node.unmaskTargetName(this.getOption('levelsTarget', node.getTargetName('levels')));
    },

    getTargets() {
        return [this._target];
    },

    build() {
        const node = this.node;
        const target = this._target;
        const targetFilename = node.resolvePath(target);
        const cache = node.getNodeCache(target);
        const declFilename = node.resolvePath(this._declFile);

        return node.requireSources([this._levelsTarget, this._declFile])
            .spread((introspections, sourceDeps) => {
                const depFiles = introspections.getFilesByTechs(['deps.js', 'deps.yaml']);

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('decl-file', declFilename) ||
                    cache.needRebuildFileList('deps-file-list', depFiles)
                ) {
                    return requireSourceDeps(sourceDeps, declFilename)
                        .then(sourceDecl => {
                            return bemDeps.read()(depFiles)
                                .then(bemDeps.parse())
                                .then(bemDeps.buildGraph)
                                .then(graph => {
                                    const resolvedDeps = graph.dependenciesOf(sourceDecl).map(convertEntity);
                                    const str = `exports.deps = ${JSON.stringify(resolvedDeps, null, 4)};\n`;

                                    return vfs.write(targetFilename, str, 'utf8')
                                        .then(() => {
                                            cache.cacheFileInfo('deps-file', targetFilename);
                                            cache.cacheFileInfo('decl-file', declFilename);
                                            cache.cacheFileList('deps-file-list', depFiles);
                                            node.resolveTarget(target, { deps: resolvedDeps });
                                        });
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

function convertEntity(obj) {
    const entity = obj.entity;

    const result = {
        block: entity.block
    };

    if (entity.elem) {
        result.elem = entity.elem;
    }

    if (entity.mod) {
        result.mod = entity.mod.name;
        result.val = entity.mod.val;
    }

    return result;
}

function requireSourceDeps(data, filename) {
    return (data ? vow.resolve(data) : fileEval(filename))
        .then(sourceDeps => {
            // todo:добавить параметр с версией декларации
            if (sourceDeps.deps) {
                return sourceDeps.deps;
            } else if (sourceDeps.blocks) {
                return bemDecl
                    .normalize(sourceDeps.blocks, { format: 'v1' })
                    .map(item => item.entity);
            } else {
                return sourceDeps;
            }
        });
}
