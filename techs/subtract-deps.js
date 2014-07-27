/**
 * subtract-deps
 * =============
 *
 * Формирует *deps* с помощью вычитания одного deps-файла из другого.
 * Может применяться в паре с `deps-provider` для получения deps для bembundle.
 *
 * **Опции**
 *
 * * *String* **from** — Таргет, из которого вычитать. Обязательная опция.
 * * *String* **what** — Таргет, который вычитать. Обязательная опция.
 * * *String* **target** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *     [require('enb-bem/techs/deps'), { target: 'router.tmp.deps.js' }],
 *     [require('enb-bem/techs/deps-provider'), {
 *         node: 'pages/index',
 *         depsTarget: 'index.deps.js'
 *     }],
 *     [require('enb-bem/techs/subtract-deps'), {
 *         what: 'index.deps.js',
 *         from: 'router.tmp.deps.js',
 *         target: 'router.deps.js'
 *     }]
 * ]);
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
        return 'subtract-deps';
    },

    configure: function () {
        this._fromTarget = this.getOption('subtractFromTarget');
        if (!this._fromTarget) {
            this._fromTarget = this.getRequiredOption('from');
        }

        this._whatTarget = this.getOption('subtractWhatTarget');
        if (!this._whatTarget) {
            this._whatTarget = this.getRequiredOption('what');
        }

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
        var cache = node.getNodeCache(target);
        var targetFilename = node.resolvePath(target);
        var fromFilename = node.resolvePath(this._fromTarget);
        var whatFilename = node.resolvePath(this._whatTarget);

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
                        .spread(function (fromDeps, whatDeps) {
                            var subtractedDeps = deps.subtract(fromDeps, whatDeps);
                            var str = 'exports.deps = ' + JSON.stringify(subtractedDeps, null, 4) + ';';

                            return vfs.write(targetFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('deps-file', targetFilename);
                                    cache.cacheFileInfo('deps-from-file', fromFilename);
                                    cache.cacheFileInfo('deps-what-file', whatFilename);
                                    node.resolveTarget(target, subtractedDeps);
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

function requireDeps(deps, filename) {
    if (deps) { return deps; }

    dropRequireCache(require, filename);
    return asyncRequire(filename)
        .then(function (result) {
            return result.deps;
        });
}
