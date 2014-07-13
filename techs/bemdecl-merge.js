/**
 * bemdecl-merge
 * =============
 *
 * Формирует *bemdecl* с помощью объединения других bemdecl-файлов.
 *
 ***Опции**
 *
 ** *String[]* **sources** — Исходные bemdecl-таргеты. Обязательная опция.
 ** *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.
 *
 ***Пример**
 *
 *```javascript
 *nodeConfig.addTech([require('enb-bem/techs/bemdecl-merge'), {
 *    sources: ['search.bemdecl.js', 'router.bemdecl.js'],
 *    target: 'all.bemdecl.js'
 *}]);
 *```
 */
var inherit = require('inherit');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var asyncRequire = require('enb/lib/fs/async-require');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');
var deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'bemdecl-merge';
    },

    configure: function () {
        var _this = this;

        this._sources = this.getOption('bemdeclSources');
        if (!this._sources) {
            this._sources = this.getRequiredOption('sources');
        }
        this._sources = this._sources.map(function (source) {
            return _this.node.unmaskTargetName(source);
        });

        this._target = this.getOption('bemdeclTarget');
        if (!this._target) {
            this._target = this.getOption('target', this.node.getTargetName('bemdecl.js'));
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
            .then(function (sourceBemdecls) {
                if (cache.needRebuildFile('bemdecl-file', targetFilename) ||
                    cache.needRebuildFileList('source-file-list', sourceFilenames)
                ) {
                    return vow.all(sourceBemdecls.map(function (bemdecl, i) {
                            if (bemdecl) { return deps.fromBemdecl(bemdecl); }

                            var filename = sourceFilenames[i];

                            dropRequireCache(require, filename);
                            return asyncRequire(filename)
                                .then(function (result) {
                                    return deps.fromBemdecl(result.blocks);
                                });
                        }))
                        .then(function (sourceDeps) {
                            var mergedDeps = deps.merge(sourceDeps);
                            var mergedBemdecl = deps.toBemdecl(mergedDeps);
                            var str = 'exports.blocks = ' + JSON.stringify(mergedBemdecl, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('bemdecl-file', targetFilename);
                                    cache.cacheFileList('source-file-list', sourceFilenames);
                                    _this.node.resolveTarget(target, mergedBemdecl);
                                });
                        });
                } else {
                    node.isValidTarget(target);
                    dropRequireCache(require, targetFilename);

                    return asyncRequire(targetFilename)
                        .then(function (result) {
                            node.resolveTarget(target, result.blocks);
                            return null;
                        });
                }
            });
    }
});
