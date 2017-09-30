var inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    fileEval = require('file-eval'),
    bemDeps = require('@bem/sdk.deps'),
    bemDecl = require('@bem/sdk.decl'),
    vfs = enb.asyncFs || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech');

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
    getName: function () {
        return 'deps';
    },

    configure: function () {
        var node = this.node;

        this._target = node.unmaskTargetName(this.getOption('target', node.getTargetName('deps.js')));
        this._declFile = node.unmaskTargetName(this.getOption('bemdeclFile', node.getTargetName('bemdecl.js')));
        this._levelsTarget = node.unmaskTargetName(this.getOption('levelsTarget', node.getTargetName('levels')));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            targetFilename = node.resolvePath(target),
            cache = node.getNodeCache(target),
            declFilename = node.resolvePath(this._declFile);

        return node.requireSources([this._levelsTarget, this._declFile])
            .spread(function (introspections, sourceDeps) {
                var depFiles = introspections.getFilesByTechs(['deps.js', 'deps.yaml']);

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('decl-file', declFilename) ||
                    cache.needRebuildFileList('deps-file-list', depFiles)
                ) {
                    return requireSourceDeps(sourceDeps, declFilename)
                        .then(function (sourceDeps) {
                            return bemDeps.read()(depFiles)
                                .then(bemDeps.parse())
                                .then(bemDeps.buildGraph)
                                .then(function (graph) {
                                    var resolvedDeps = graph.dependenciesOf(sourceDeps).map(convertEntity),
                                        str = 'exports.deps = ' + JSON.stringify(resolvedDeps, null, 4) + ';\n';

                                    return vfs.write(targetFilename, str, 'utf8')
                                        .then(function () {
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
                        .then(function (result) {
                            node.resolveTarget(target, result);
                            return null;
                        });
                }
            });
    }
});

function convertEntity(obj) {
    var entity = obj.entity,
        result = {
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
        .then(function (sourceDeps) {
            // todo:добавить параметр с версией декларации
            if (sourceDeps.deps) {
                return sourceDeps.deps;
            } else if (sourceDeps.blocks) {
                return bemDecl
                    .normalize(sourceDeps.blocks, { format: 'v1' })
                    .map(function (item) {
                        return item.entity;
                    });
            } else {
                return sourceDeps;
            }
        });
}
