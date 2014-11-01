/**
 * provide-deps
 * ============
 *
 * Копирует DEPS-файл в текущую ноду по указанному имени из указанной ноды.
 *
 * Может понадобиться для объединения DEPS-файлов из разных нод.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.deps.js` (демаскируется в рамках текущей ноды).
 * Результирующий DEPS-файл.
 *
 * `node`
 *
 * Тип: `String`. Обязательная опция.
 * Путь ноды с исходным DEPS-файлом.
 *
 * `source`
 *
 * Тип: `String`. По умолчанию: `?.deps.js` (демаскируется в рамках исходной ноды).
 * Исходный DEPS-файл, который будет скопирован.
 *
 * Пример:
 *
 * Ноды в файловой системе до сборки:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.deps.js
 * ├── bundle-2/
 *     └── bundle-1.deps.js
 * └── bundle-3/
 *
 * Что должно получиться после сборки:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.deps.js
 * ├── bundle-2/
 *     └── bundle-2.deps.js
 * └── bundle-3/
 *     ├── bundle-1.deps.js
 *     └── bundle-2.deps.js
 *
 * ```js
 * var techs = require('enb-bem-techs');
 * config.node('bundle-3', function (nodeConfig) {
 *     nodeConfig.addTechs([
 *         // Копируем DEPS-файл из ноды `bundle-1` в `bundle-3`
 *         [techs.provideDeps, {
 *             node: 'bundles/bundle-1',
 *             target: 'bundle-1.deps.js'
 *         }],
 *
 *         // Копируем DEPS-файл из ноды `bundle-2` в `bundle-3`
 *         [techs.provideDeps, {
 *             node: 'bundles/bundle-2',
 *             target: 'bundle-2.deps.js'
 *         }]
 *     ]);
 * });
 * ```
 */
var inherit = require('inherit'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'provide-deps';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._target = this.getOption('depsTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem-techs', this.getName(),
                'depsTarget', 'target');
        } else {
            this._target = this.getOption('target', '?.deps.js');
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._fromNode = this.getOption('sourceNodePath');
        if (this._fromNode) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(), 'sourceNodePath', 'node');
        } else {
            this._fromNode = this.getRequiredOption('node');
        }

        this._sourceTarget = this.getOption('sourceTarget');
        if (this._sourceTarget) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(), 'sourceTarget', 'source');
        } else {
            this._sourceTarget = this.getOption('source', '?.deps.js');
        }
        this._sourceTarget = this.node.unmaskNodeTargetName(this._fromNode, this._sourceTarget);
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            fromNode = this._fromNode,
            sourceTarget = this._sourceTarget,
            targetFilename = node.resolvePath(target),
            sourceFilename = node.resolveNodePath(fromNode, sourceTarget),
            cache = node.getNodeCache(target),
            requirements = {};

        requirements[fromNode] = [sourceTarget];

        return this.node.requireNodeSources(requirements)
            .then(function (results) {
                var preDeps = results[fromNode][0];

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('deps-source-file', sourceFilename)
                ) {
                    return requireDeps(preDeps, sourceFilename)
                        .then(function (res) {
                            var str = 'exports.deps = ' + JSON.stringify(res.deps, null, 4) + ';\n';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileInfo('deps-source-file', sourceFilename);
                                    node.resolveTarget(target, { deps: res.deps });
                                });
                        });
                } else {
                    node.isValidTarget(target);

                    return requireDeps(null, targetFilename)
                        .then(function (resDeps) {
                            node.resolveTarget(target, resDeps);
                            return null;
                        });
                }
            });
    }
});

function requireDeps(data, filename) {
    if (data) { return vow.resolve(data); }

    dropRequireCache(require, filename);
    return asyncRequire(filename);
}
