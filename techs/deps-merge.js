/**
 * deps-merge
 * ==========
 *
 * Формирует *deps* с помощью объединения других deps-файлов.
 *
 * **Опции**
 *
 * * *String[]* **sources** — Исходные deps-таргеты. Обязательная опция.
 * * *String* **target** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([require('enb-bem/techs/deps-merge'), {
 *     sources: ['search.deps.js', 'router.deps.js'],
 *     target: 'all.deps.js'
 * }]);
 * ```
 */
var inherit = require('inherit');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var asyncRequire = require('enb/lib/fs/async-require');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');
var deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'deps-merge';
    },

    configure: function () {
        var _this = this;

        this._sources = this.getOption('depsSources');
        if (!this._sources) {
            this._sources = this.getRequiredOption('sources');
        }
        this._sources = this._sources.map(function (source) {
            return _this.node.unmaskTargetName(source);
        });

        this._target = this.getOption('depsTarget');
        if (!this._target) {
            this._target = this.getOption('target', this.node.getTargetName('deps.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var node = this.node;
        var target = this._target;
        var sources = this._sources;
        var cache = node.getNodeCache(target);
        var targetFilename = node.resolvePath(target);
        var sourceFilenames = sources.map(function (sourceTarget) {
            return node.resolvePath(sourceTarget);
        });

        return this.node.requireSources(sources)
            .then(function (sourceDeps) {
                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFileList('source-file-list', sourceFilenames)
                ) {
                    return vow.all(sourceDeps.map(function (deps, i) {
                            if (deps) { return deps; }

                            var filename = sourceFilenames[i];

                            dropRequireCache(require, filename);
                            return asyncRequire(filename)
                                .then(function (result) {
                                    return result.deps;
                                });
                        }))
                        .then(function (sourceDeps) {
                            var mergedDeps = deps.merge(sourceDeps);
                            var str = 'exports.deps = ' + JSON.stringify(mergedDeps, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileList('source-file-list', sourceFilenames);
                                    _this.node.resolveTarget(target, mergedDeps);
                                });
                        });
                } else {
                    node.isValidTarget(target);
                    dropRequireCache(require, targetFilename);

                    return asyncRequire(targetFilename)
                        .then(function (result) {
                            node.resolveTarget(target, result.deps);
                            return null;
                        });
                }
            });
    }
});
