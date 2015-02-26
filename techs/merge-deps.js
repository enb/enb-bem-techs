/**
 * merge-deps
 * ==========
 *
 * Объединяет DEPS-файлы и BEMDECL-файлы в результирующий DEPS-файл.
 *
 * Может понадобиться для формирования `merged`-бандла.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.deps.js`.
 * Результирующий DEPS-файл.
 *
 * `sources`
 *
 * Тип: `String[]`. Обязательная опция.
 * Исходные DEPS-файлы. Обязательная опция.
 *
 * Пример:
 *
 * Ноды в файловой системе до сборки:
 *
 * merged-bundle/
 * ├── bundle-1.deps.js
 * └── bundle-2.deps.js
 *
 * Что должно получиться после сборки:
 *
 * merged-bundle/
 * ├── bundle-1.deps.js
 * ├── bundle-2.deps.js
 * └── merged-bundle.deps.js
 *
 * ```js
 * var techs = require('enb-bem-techs');
 * nodeConfig.addTech([techs.mergeDeps, {
 *     sources: ['bundle-1.deps.js', 'bundle-2.deps.js'],
 *     target: 'merged-bundle.deps.js'
 * }]);
 * ```
 */
var inherit = require('inherit'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'merge-deps';
    },

    configure: function () {
        var _this = this,
            logger = this.node.getLogger();

        this._target = this.getOption('depsTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem', this.getName(),
                'depsTarget', 'target');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('deps.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._sources = this.getOption('depsSources');
        if (this._sources) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(), 'depsSources', 'sources');
        } else {
            this._sources = this.getRequiredOption('sources');
        }
        this._sources = this._sources.map(function (source) {
            return _this.node.unmaskTargetName(source);
        });
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this,
            node = this.node,
            target = this._target,
            sources = this._sources,
            cache = node.getNodeCache(target),
            targetFilename = node.resolvePath(target),
            sourceFilenames = sources.map(function (sourceTarget) {
                return node.resolvePath(sourceTarget);
            });

        return this.node.requireSources(sources)
            .then(function (sourceDeps) {
                var rebuildNeeded = cache.needRebuildFile('deps-file', targetFilename);

                if (!rebuildNeeded) {
                    sourceFilenames.forEach(function (filename) {
                        if (cache.needRebuildFile(filename, filename)) {
                            rebuildNeeded = true;
                        }
                    });
                }

                if (rebuildNeeded) {
                    return vow.all(sourceDeps.map(function (source, i) {
                            if (source) {
                                return getDeps(source);
                            }

                            var filename = sourceFilenames[i];

                            dropRequireCache(require, filename);
                            return asyncRequire(filename)
                                .then(function (res) {
                                    return getDeps(res);
                                });
                        }))
                        .then(function (sourceDeps) {
                            var mergedDeps = deps.merge(sourceDeps),
                                str = 'exports.deps = ' + JSON.stringify(mergedDeps, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    sourceFilenames.forEach(function (filename) {
                                        cache.cacheFileInfo(filename, filename);
                                    });
                                    _this.node.resolveTarget(target, { deps: mergedDeps });
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

function getDeps(source) {
    if (source.blocks) {
        return deps.fromBemdecl(source.blocks);
    }

    return Array.isArray(source) ? source : source.deps;
}
