var inherit = require('inherit'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    BaseTech = enb.BaseTech || require('enb/lib/tech/base-tech'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require'),
    DepsResolver = require('../lib/deps/deps-resolver'),
    deps = require('../lib/deps/deps');

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
        var logger = this.node.getLogger();

        this._target = this.getOption('depsTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem-techs', this.getName(),
                'depsTarget', 'target', ' It will be removed in v3.0.0.');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('deps.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._declFile = this.getOption('bemdeclTarget');
        if (this._declFile) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem-techs', this.getName(),
                'bemdeclTarget', 'bemdeclFile', ' It will be removed in v3.0.0.');
        } else {
            this._declFile = this.getOption('bemdeclFile', this.node.getTargetName('bemdecl.js'));
        }
        this._declFile = this.node.unmaskTargetName(this._declFile);

        this._levelsTarget = this.node.unmaskTargetName(
            this.getOption('levelsTarget', this.node.getTargetName('levels')));
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
            .spread(function (levels, sourceDeps) {
                var depFiles = levels.getFilesBySuffix('deps.js').concat(levels.getFilesBySuffix('deps.yaml'));

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('decl-file', declFilename) ||
                    cache.needRebuildFileList('deps-file-list', depFiles)
                ) {
                    return requireSourceDeps(sourceDeps, declFilename)
                        .then(function (sourceDeps) {
                            var resolver = new DepsResolver(levels),
                                decls = resolver.normalizeDeps(sourceDeps);

                            return resolver.addDecls(decls)
                                .then(function () {
                                    var resolvedDeps = resolver.resolve(),
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
