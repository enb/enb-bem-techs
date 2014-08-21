/**
 * provide-bemdecl
 * ===============
 *
 * Копирует *bemdecl* в текущую ноду под нужным именем из другой ноды. Может понадобиться, например,
 * для объединения bemdecl'ов.
 *
 * **Опции**
 *
 * * *String* **node** — Путь исходной ноды с нужным bemdecl'ом. Обязательная опция.
 * * *String* **source** — Исходный bemdecl, который будет копироваться.
 *   По умолчанию — `?.bemdecl.js` (демаскируется в рамках исходной ноды).
 * * *String* **target** — Результирующий bemdecl-таргет.
 *   По умолчанию — `?.bemdecl.js` (демаскируется в рамках текущей ноды).
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([require('enb-bem/techs/provide-bemdecl'), {
 *     node: 'bundles/router',
 *     source: 'router.bemdecl.js',
 *     target: 'router.bemdecl.js'
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
        return 'provide-bemdecl';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._target = this.getOption('bemdeclTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem', this.getName(),
                'bemdeclTarget', 'target');
        } else {
            this._target = this.getOption('target', '?.bemdecl.js');
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
            this._sourceTarget = this.getOption('source', '?.bemdecl.js');
        }
        this._sourceTarget = this.node.unmaskNodeTargetName(this._fromNode, this._sourceTarget);
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
        
        return node.requireNodeSources(requirements)
            .then(function (results) {
                var preBemdecl = results[fromNode][0];

                if (cache.needRebuildFile('bemdecl-file', targetFilename) ||
                    cache.needRebuildFile('bemdecl-source-file', sourceFilename)
                ) {
                    return requireBemdecl(preBemdecl, sourceFilename)
                        .then(function (resBemdecl) {
                            var str = 'exports.blocks = ' + JSON.stringify(resBemdecl, null, 4) + ';\n';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('bemdecl-file', targetFilename);
                                    cache.cacheFileInfo('bemdecl-source-file', sourceFilename);
                                    node.resolveTarget(target, resBemdecl);
                                });
                        });
                } else {
                    node.isValidTarget(target);

                    return requireBemdecl(null, targetFilename)
                        .then(function (resBemdecl) {
                            node.resolveTarget(target, resBemdecl);
                            return null;
                        });
                }
            });
    }
});

function requireBemdecl(data, filename) {
    if (data) { return vow.resolve(data); }

    dropRequireCache(require, filename);
    return asyncRequire(filename)
        .then(function (result) {
            return result.blocks;
        });
}
