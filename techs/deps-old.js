/**
 * deps-old
 * ========
 *
 * Дополняет декларацию БЭМ-сущностей на основе информации из технологий зависимостей (`deps.js`)
 * БЭМ-сущностей.
 *
 * Использует алгоритм, заимствованный из [bem-tools](http://ru.bem.info/tools/bem/bem-tools/).
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
 * `strict`
 *
 * Тип: `Boolean`. По умолчанию: `false`.
 * Включает строгий режим раскрытия зависимостей: если будет найдена хотя бы одна циклическая зависимость
 * `mustDeps` (A <- B <- A), то сборка прекратится с ошибкой.
 *
 * Пример:
 *
 * Раскрытие зависимостей по BEMDECL-файлу.
 *
 * ```js
 * var techs = require('enb-bem-techs');
 *
 * nodeConfig.addTech([techs.depsOld, {
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
 * nodeConfig.addTech([techs.depsOld, {
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
    OldDeps = require('../exlib/deps-old').OldDeps,
    deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {

    getName: function () {
        return 'deps-old';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._target = this.getOption('depsTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem-techs', this.getName(),
                'depsTarget', 'target', ' It will be removed from this package in v3.0.0.');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('deps.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._declFile = this.getOption('bemdeclTarget');
        if (this._declFile) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem-techs', this.getName(),
                'bemdeclTarget', 'bemdeclFile', ' It will be removed from this package in v3.0.0.');
        } else {
            this._declFile = this.getOption('bemdeclFile', this.node.getTargetName('bemdecl.js'));
        }
        this._declFile = this.node.unmaskTargetName(this._declFile);

        this._levelsTarget = this.node.unmaskTargetName(
            this.getOption('levelsTarget', this.node.getTargetName('levels')));

        this._strict = this.getOption('strict');
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            targetFilename = node.resolvePath(target),
            cache = node.getNodeCache(target),
            logger = node.getLogger(),
            declFilename = this.node.resolvePath(this._declFile),
            strictMode = this._strict;

        return node.requireSources([this._levelsTarget, this._declFile])
            .spread(function (levels, sourceDeps) {
                var depFiles = levels.getFilesBySuffix('deps.js');

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('decl-file', declFilename) ||
                    cache.needRebuildFileList('deps-file-list', depFiles)
                ) {
                    return requireSourceDeps(sourceDeps, declFilename)
                        .then(function (sourceDeps) {
                            return (new OldDeps(sourceDeps, strictMode).expandByFS({ levels: levels }))
                                .then(function (resolvedDeps) {
                                    var resultDeps = resolvedDeps.getDeps(),
                                        loopPaths = resolvedDeps.getLoops().mustDeps.map(function (loop) {
                                            return loop.concat(loop[0]).join(' <- ');
                                        }),
                                        str = 'exports.deps = ' + JSON.stringify(resultDeps, null, 4) + ';\n';

                                    if (strictMode && loopPaths.length > 0) {
                                        throw new Error('Circular mustDeps: \n' + loopPaths.join('\n'));
                                    } else {
                                        loopPaths.forEach(function (loopPath) {
                                            logger.logWarningAction('circular mustDeps', target, loopPath);
                                        });
                                    }

                                    return vfs.write(targetFilename, str, 'utf8')
                                        .then(function () {
                                            cache.cacheFileInfo('deps-file', targetFilename);
                                            cache.cacheFileInfo('decl-file', declFilename);
                                            cache.cacheFileList('deps-file-list', depFiles);
                                            node.resolveTarget(target, { deps: resultDeps });
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
                return sourceDeps.blocks;
            }

            return deps.toBemdecl(Array.isArray(sourceDeps) ? sourceDeps : sourceDeps.deps);
        });
}
