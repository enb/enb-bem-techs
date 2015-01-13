/**
 * merge-bemdecl
 * =============
 *
 * Объединяет BEMDECL-файлы в результирующий.
 *
 * Может понадобиться для формирования `merged`-бандла.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.bemdecl.js`.
 * Результирующий BEMDECL-файл.
 *
 * `sources`
 *
 * Тип: `String[]`. Обязательная опция.
 *
 * Исходные BEMDECL-файлы.
 *
 * Пример:
 *
 * Ноды в файловой системе до сборки:
 *
 * merged-bundle/
 * ├── bundle-1.bemdecl.js
 * └── bundle-2.bemdecl.js
 *
 * Что должно получиться после сборки:
 *
 * merged-bundle/
 * ├── bundle-1.bemdecl.js
 * ├── bundle-2.bemdecl.js
 * └── merged-bundle.bemdecl.js
 *
 * ```js
 * var techs = require('enb-bem-techs');
 *
 * nodeConfig.addTech([techs.mergeBemdecl, {
 *     sources: ['bundle-1.bemdecl.js', 'bundle-2.bemdecl.js'],
 *     target: 'merged-bundle.bemdecl.js'
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
        return 'merge-bemdecl';
    },

    configure: function () {
        var _this = this,
            logger = this.node.getLogger();

        this._target = this.getOption('bemdeclTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem', this.getName(),
                'bemdeclTarget', 'target');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('bemdecl.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._sources = this.getOption('bemdeclSources');
        if (this._sources) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(),
                'bemdeclSources', 'sources');
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
            .then(function (sourceBemdecls) {
                var rebuildNeeded = cache.needRebuildFile('bemdecl-file', targetFilename);
                if (!rebuildNeeded) {
                    sourceFilenames.forEach(function (filename) {
                        if (cache.needRebuildFile(filename, filename)) {
                            rebuildNeeded = true;
                        }
                    });
                }
                if (rebuildNeeded) {
                    return vow.all(sourceBemdecls.map(function (bemdecl, i) {
                            if (bemdecl) { return deps.fromBemdecl(bemdecl.blocks); }

                            var filename = sourceFilenames[i];

                            dropRequireCache(require, filename);
                            return asyncRequire(filename)
                                .then(function (result) {
                                    return deps.fromBemdecl(result.blocks);
                                });
                        }))
                        .then(function (sourceDeps) {
                            var mergedDeps = deps.merge(sourceDeps),
                                mergedBemdecl = deps.toBemdecl(mergedDeps),
                                str = 'exports.blocks = ' + JSON.stringify(mergedBemdecl, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('bemdecl-file', targetFilename);
                                    sourceFilenames.forEach(function (filename) {
                                        cache.cacheFileInfo(filename, filename);
                                    });
                                    _this.node.resolveTarget(target, { blocks: mergedBemdecl });
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
