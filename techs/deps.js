/**
 * deps
 * ====
 *
 * Раскрывает зависимости. Сохраняет в виде `?.deps.js`.
 *
 * **Опции**
 *
 * * *String* **sourceDepsFile** — Файл с исходными зависимостями. По умолчанию — `?.bemdecl.js`.
 * * *String* **format** — Формат исходных зависимостей. По умолчанию — `bemdecl`.
 * * *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
 * * *String* **target** — Результирующий deps. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * Обычное использование:
 * ```javascript
 * nodeConfig.addTech(require('enb-bem/techs/deps'));
 * ```
 *
 * Сборка специфического deps:
 * ```javascript
 * nodeConfig.addTech([require('enb-bem/techs/deps'), {
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
    DepsResolver = require('../lib/deps/deps-resolver'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {

    getName: function () {
        return 'deps';
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

        this._sourceDepsFile = this.getOption('bemdeclTarget');
        if (this._sourceDepsFile) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(), 'bemdeclTarget', 'sourceDepsFile');
        } else {
            this._sourceDepsFile = this.getOption('sourceDepsFile', this.node.getTargetName('bemdecl.js'));
        }
        this._sourceDepsFile = this.node.unmaskTargetName(this._sourceDepsFile);
        this._format = this.getOption('format', 'bemdecl');

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
            format = this._format,
            sourceDepsFilename = this.node.resolvePath(this._sourceDepsFile);

        return this.node.requireSources([this._levelsTarget, this._sourceDepsFile])
            .spread(function (levels, sourceDeps) {
                var depFiles = levels.getFilesBySuffix('deps.js').concat(levels.getFilesBySuffix('deps.yaml'));

                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('source-deps-file', sourceDepsFilename) ||
                    cache.needRebuildFileList('deps-file-list', depFiles)
                ) {
                    return requireSourceDeps(sourceDeps, sourceDepsFilename, format)
                        .then(function (sourceDeps) {
                            var resolver = new DepsResolver(levels),
                                decls = resolver.normalizeDeps(sourceDeps);

                            return resolver.addDecls(decls)
                                .then(function () {
                                    var resolvedDeps = resolver.resolve(),
                                        str = 'exports.deps = ' + JSON.stringify(resolvedDeps, null, 4) + ';\n';

                                    return vfs.write(targetFilename, str, 'utf8')
                                        .then(function () {
                                            cache.cacheFileInfo('deps-file', targetFilename);
                                            cache.cacheFileInfo('source-deps-file', sourceDepsFilename);
                                            cache.cacheFileList('deps-file-list', depFiles);
                                            node.resolveTarget(target, resolvedDeps);
                                        });
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

function requireSourceDeps(data, filename, format) {
    return (data ? vow.resolve(data) : (
        dropRequireCache(require, filename),
        asyncRequire(filename)
            .then(function (result) {
                if (format === 'bemdecl') {
                    return result.blocks;
                }

                if (format === 'deps') {
                    return result.deps;
                }
            })
        ))
        .then(function (sourceDeps) {
            if (format === 'bemdecl') {
                sourceDeps = deps.fromBemdecl(sourceDeps);
            }

            return sourceDeps;
        });
}
