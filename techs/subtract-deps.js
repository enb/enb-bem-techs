/**
 * subtract-deps
 * =============
 *
 * Формирует DEPS-файл, вычитая один DEPS-файл из другого.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.deps.js`.
 * Результирующий DEPS-файл.
 *
 * `from`
 *
 * Тип: `String`. Обязательная опция.
 * DEPS-файл, из которого вычитают.
 *
 * `what`
 *
 * Тип: `String`. Обязательная опция.
 * DEPS-файл, который вычитают.
 *
 * Пример:
 *
 * ```js
 * var techs = require('enb-bem-techs');
 *
 * nodeConfig.addTech([techs.subtractDeps, {
 *     from: 'bundle-1.deps.js',
 *     what: 'bundle-2.deps.js',
 *     target: 'bundle.deps.js'
 * } ]);
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
        return 'subtract-deps';
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

        this._fromTarget = this.getOption('subtractFromTarget');
        if (this._fromTarget) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem-techs', this.getName(), 'subtractFromTarget', 'from');
        } else {
            this._fromTarget = this.getRequiredOption('from');
        }

        this._whatTarget = this.getOption('subtractWhatTarget');
        if (this._whatTarget) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem-techs', this.getName(), 'subtractWhatTarget', 'what');
        } else {
            this._whatTarget = this.getRequiredOption('what');
        }
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            cache = node.getNodeCache(target),
            targetFilename = node.resolvePath(target),
            fromFilename = node.resolvePath(this._fromTarget),
            whatFilename = node.resolvePath(this._whatTarget);

        return this.node.requireSources([this._fromTarget, this._whatTarget])
            .spread(function (fromDeps, whatDeps) {
                if (cache.needRebuildFile('deps-file', targetFilename) ||
                    cache.needRebuildFile('deps-from-file', fromFilename) ||
                    cache.needRebuildFile('deps-what-file', whatFilename)
                ) {
                    return vow.all([
                            requireDeps(fromDeps, fromFilename),
                            requireDeps(whatDeps, whatFilename)
                        ])
                        .spread(function (from, what) {
                            var fromDeps = Array.isArray(from) ? from : from.deps,
                                whatDeps = Array.isArray(what) ? what : what.deps,
                                subtractedDeps = deps.subtract(fromDeps, whatDeps),
                                str = 'exports.deps = ' + JSON.stringify(subtractedDeps, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileInfo('deps-from-file', fromFilename);
                                    cache.cacheFileInfo('deps-what-file', whatFilename);
                                    node.resolveTarget(target, { deps: subtractedDeps });
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

function requireDeps(deps, filename) {
    if (deps) { return deps; }

    dropRequireCache(require, filename);
    return asyncRequire(filename);
}
