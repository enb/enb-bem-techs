/**
 * deps
 * ====
 *
 * Дополняет декларацию БЭМ-сущностей на основе информации из технологий зависимостей (`deps.js` или `deps.yaml`)
 * БЭМ-сущностей.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.deps.js`.
 * Результирующий DEPS-файл.
 *
 * `bemdeclFile`
 *
 * Тип: `String`. По умолчанию: `?.bemdecl.js`.
 * Файл с декларацией БЭМ-сущностей.
 *
 * `levelsTarget`
 *
 * Тип: `String`. По умолчанию: `?.levels`.
 * Таргет с интроспекцией уровней (результат сканирования `levels` технологией).
 *
 * Пример:
 *
 * Раскрытие зависимостей по BEMDECL-файлу.
 *
 * ```js
 * var techs = require('enb-bem-techs');
 *
 * nodeConfig.addTech([techs.deps, {
 *    bemdeclFile: '?.bemdecl.js',
 *    target: '?.deps.js'
 * }]);
 * ```
 *
 * Раскрытие зависимостей по DEPS-файлу.
 *
 * ```js
 * var techs = require('enb-bem-techs');
 *
 * nodeConfig.addTech([techs.deps, {
 *    bemdeclFile: 'source-decl.deps.js',
 *    target: '?.deps.js'
 * }]);
 * ```
 */
var inherit = require('inherit'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    DepsResolver = require('../lib/deps/deps-resolver'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {

    getName: function () {
        return 'deps';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._target = this.getOption('depsTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem-techs', this.getName(),
                'depsTarget', 'target');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('deps.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._declFile = this.getOption('bemdeclTarget');
        if (this._declFile) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem-techs', this.getName(), 'bemdeclTarget', 'bemdeclFile');
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
                    dropRequireCache(require, targetFilename);

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
            dropRequireCache(require, filename),
            asyncRequire(filename)
        ))
        .then(function (sourceDeps) {
            if (sourceDeps.blocks) {
                return deps.fromBemdecl(sourceDeps.blocks);
            }

            return Array.isArray(sourceDeps) ? sourceDeps : sourceDeps.deps;
        });
}
