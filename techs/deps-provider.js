/**
 * deps-provider
 * =============
 *
 * Копирует *deps* в текущую ноду под нужным именем из другой ноды.
 * Может понадобиться, например, для объединения deps'ов.
 *
 * **Опции**
 *
 * * *String* **node** — Путь исходной ноды с нужным deps'ом. Обязательная опция.
 * * *String* **source** — Исходный deps, который будет копироваться.
 *   По умолчанию — `?.deps.js` (демаскируется в рамках исходной ноды).
 * * *String* **target** — Результирующий deps-таргет.
 *   По умолчанию — `?.deps.js` (демаскируется в рамках текущей ноды).
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([require('enb/techs/deps-provider'), {
 *     node: 'bundles/router',
 *     source: 'router.deps.js',
 *     target: 'router.deps.js'
 * }]);
 * ```
 */
var inherit = require('inherit');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var asyncRequire = require('enb/lib/fs/async-require');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'deps-provider';
    },

    configure: function () {
        this._fromNode = this.getOption('sourceNodePath');
        if (!this._fromNode) {
            this._fromNode = this.getRequiredOption('node');
        }

        this._sourceTarget = this.getOption('sourceTarget');
        if (!this._sourceTarget) {
            this._sourceTarget = this.getOption('source', '?.deps.js');
        }
        this._sourceTarget = this.node.unmaskNodeTargetName(this._fromNode, this._sourceTarget);

        this._target = this.getOption('depsTarget');
        if (!this._target) {
            this._target = this.getOption('target', '?.deps.js');
        }
        this._target = this.node.unmaskTargetName(this._target);
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node;
        var target = this._target;
        var fromNode = this._fromNode;
        var sourceTarget = this._sourceTarget;
        var targetFilename = node.resolvePath(target);
        var sourceFilename = node.resolveNodePath(fromNode, sourceTarget);
        var cache = node.getNodeCache(target);
        var requirements = {};

        requirements[fromNode] = [sourceTarget];
        
        return this.node.requireNodeSources(requirements)
            .then(function (results) {
                var preDeps = results[fromNode][0];

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('source-deps-file', sourceFilename)
                ) {
                    return requireDeps(preDeps, sourceFilename)
                        .then(function (resDeps) {
                            var str = 'exports.deps = ' + JSON.stringify(resDeps, null, 4) + ';\n';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileInfo('deps-source-file', sourceFilename);
                                    node.resolveTarget(target, resDeps);
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
    return asyncRequire(filename)
        .then(function (result) {
            return result.deps;
        });
}
