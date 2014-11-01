/**
 * provide-bemdecl
 * ===============
 *
 * Копирует BEMDECL-файл в текущую ноду по указанному имени из указанной ноды.
 *
 * Может понадобиться для объединения BEMDECL-файлов из разных нод.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.bemdecl.js` (демаскируется в рамках текущей ноды).
 * Результирующий BEMDECL-файл.
 *
 * `node`
 *
 * Тип: `String`. Обязательная опция.
 * Путь ноды с исходным BEMDECL-файлом.
 *
 * `source`
 *
 * Тип: `String`. По умолчанию: `?.bemdecl.js` (демаскируется в рамках исходной ноды).
 * Исходный BEMDECL-файл, который будет скопирован.
 *
 * Пример:
 *
 * Ноды в файловой системе до сборки:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.bemdecl.js
 * ├── bundle-2/
 *     └── bundle-1.bemdecl.js
 * └── bundle-3/
 *
 * Что должно получиться после сборки:
 *
 * bundles/
 * ├── bundle-1/
 *     └── bundle-1.bemdecl.js
 * ├── bundle-2/
 *     └── bundle-2.bemdecl.js
 * └── bundle-3/
 *     ├── bundle-1.bemdecl.js
 *     └── bundle-2.bemdecl.js
 *
 * ```js
 * var techs = require('enb-bem-techs');
 * config.node('bundle-3', function (nodeConfig) {
 *     nodeConfig.addTechs([
 *         // Копируем BEMDECL-файл из ноды `bundle-1` в `bundle-3`
 *         [techs.provideBemdecl, {
 *             node: 'bundles/bundle-1',
 *             target: 'bundle-1.bemdecl.js'
 *         }],
 *
 *         // Копируем BEMDECL-файл из ноды `bundle-2` в `bundle-3`
 *         [techs.provideBemdecl, {
 *             node: 'bundles/bundle-2',
 *             target: 'bundle-2.bemdecl.js'
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
        var node = this.node,
            target = this._target,
            fromNode = this._fromNode,
            sourceTarget = this._sourceTarget,
            targetFilename = node.resolvePath(target),
            sourceFilename = node.resolveNodePath(fromNode, sourceTarget),
            cache = node.getNodeCache(target),
            requirements = {};

        requirements[fromNode] = [sourceTarget];

        return node.requireNodeSources(requirements)
            .then(function (results) {
                var preBemdecl = results[fromNode][0];

                if (cache.needRebuildFile('bemdecl-file', targetFilename) ||
                    cache.needRebuildFile('bemdecl-source-file', sourceFilename)
                ) {
                    return requireBemdecl(preBemdecl, sourceFilename)
                        .then(function (resBemdecl) {
                            var blocks = resBemdecl.blocks,
                                str = 'exports.blocks = ' + JSON.stringify(blocks, null, 4) + ';\n';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('bemdecl-file', targetFilename);
                                    cache.cacheFileInfo('bemdecl-source-file', sourceFilename);
                                    node.resolveTarget(target, { blocks: blocks });
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
    return asyncRequire(filename);
}
