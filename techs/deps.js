var inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require'),

    FileList = enb.FileList,
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    DepsResolver = require('../lib/deps/deps-resolver'),
    deps = require('../lib/deps/deps');

const toArray = require('stream-to-array');
const bemDeps = require('@bem/deps');
const BemGraph = require('bem-graph').BemGraph;

/**
 * @class DepsTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Supplements declaration of BEM entities using information about dependencies in `deps.js` or `deps.yaml` files.
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
            declFilename = this.node.resolvePath(this._declFile);

        return this.node.requireSources([this._levelsTarget, this._declFile])
            .spread(function (introspection, sourceDecl) {
                var depFiles = introspection.getFilesByTechs(['deps.js', 'deps.yaml'])
                    .map(file => FileList.getFileInfo(file.path));

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('decl-file', declFilename) ||
                    cache.needRebuildFileList('deps-file-list', depFiles)
                ) {
                    return requireSourceDeps(sourceDecl, declFilename)
                        .then(function (decl) {
                            return toArray(bemDeps.load({
                                levels: introspection._levels
                            })).then((relations) => {
                                return { decl, relations };
                            });
                        })
                        .then((data) => {
                            const decl = data.decl;
                            const deps = data.relations;
                            const graph = new BemGraph();

                            deps.forEach((item) => {
                                item.dependOn.forEach(depend => {
                                    const isOrdered = depend.order;
                                    const linkMethod = isOrdered ? 'dependsOn' : 'linkWith';

                                    graph.vertex(item.entity, item.tech)
                                        [linkMethod](depend.entity, depend.tech);
                                });
                            });

                            return graph.dependenciesOf(decl);
                        })
                        .then((decl) => {
                            return decl.map(vertex => {
                                const entity = vertex.entity;

                                const item = { block: entity.block };

                                entity.elem && (item.elem = entity.elem);
                                entity.mod && entity.mod.name && (item.mod = entity.mod.name);
                                entity.mod && entity.mod.val && (item.val = entity.mod.val);

                                return item;
                            });
                        })
                        .then((decl) => {
                            const str = 'exports.deps = ' + JSON.stringify(decl, null, 4) + ';\n';

                            return vfs.write(targetFilename, str, 'utf8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileInfo('decl-file', declFilename);
                                    cache.cacheFileList('deps-file-list', depFiles);
                                    node.resolveTarget(target, { deps: decl });
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

function requireSourceDeps(data, filename) {
    return (data ? vow.resolve(data) : (
            clearRequire(filename),
            asyncRequire(filename)
        ))
        .then(function (sourceDeps) {
            if (sourceDeps.blocks) {
                return deps.fromBemdecl(sourceDeps.blocks);
            }

            return Array.isArray(sourceDeps) ? sourceDeps : sourceDeps.deps;
        });
}
