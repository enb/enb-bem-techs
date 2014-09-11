/**
 * provide-deps
 * ============
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
 * nodeConfig.addTech([require('enb/techs/provide-deps'), {
 *     node: 'bundles/router',
 *     source: 'router.deps.js',
 *     target: 'router.deps.js'
 * }]);
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
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem', this.getName(),
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
                    cache.needRebuildFile('source-deps-file', sourceFilename)
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
