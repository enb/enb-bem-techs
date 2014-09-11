/**
 * deps-old
 * ========
 *
 * Раскрывает зависимости. Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.
 *
 * **Опции**
 *
 * * *String* **bemdeclFile** — Файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
 * * *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
 * * *String* **target** — Результирующий deps. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * Обычное использование:
 * ```javascript
 * nodeConfig.addTech(require('enb-bem/techs/deps-old'));
 * ```
 *
 * Сборка специфического deps:
 * ```javascript
 * nodeConfig.addTech([require('enb-bem/techs/deps-old'), {
 *     sourceDepsFile: 'search.bemdecl.js',
 *     target: 'search.deps.js'
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
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem', this.getName(),
                'depsTarget', 'target');
        } else {
            this._target = this.getOption('target', this.node.getTargetName('deps.js'));
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._declFile = this.getOption('bemdeclTarget');
        if (this._declFile) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(),
                'bemdeclTarget', 'bemdeclFile');
        } else {
            this._declFile = this.getOption('bemdeclFile', this.node.getTargetName('bemdecl.js'));
        }
        this._declFile = this.node.unmaskTargetName(this._declFile);

        this._levelsTarget = this.node.unmaskTargetName(
            this.getOption('levelsTarget', this.node.getTargetName('levels')));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            targetFilename = node.resolvePath(target),
            cache = node.getNodeCache(target),
            declFilename = this.node.resolvePath(this._declFile);

        return this.node.requireSources([this._levelsTarget, this._declFile])
            .spread(function (levels, sourceDeps) {
                var depFiles = levels.getFilesBySuffix('deps.js').concat(levels.getFilesBySuffix('deps.yaml'));

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('decl-file', declFilename) ||
                    cache.needRebuildFileList('deps-file-list', depFiles)
                ) {
                    return requireSourceDeps(sourceDeps, declFilename)
                        .then(function (sourceDeps) {
                            return (new OldDeps(sourceDeps).expandByFS({ levels: levels }))
                                .then(function (resolvedDeps) {
                                    var resultDeps = resolvedDeps.getDeps(),
                                        str = 'exports.deps = ' + JSON.stringify(resultDeps, null, 4) + ';\n';

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
                return deps.fromBemdecl(sourceDeps.blocks);
            }

            return sourceDeps.deps;
        });
}
