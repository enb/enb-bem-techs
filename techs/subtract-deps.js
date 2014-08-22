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
 *     [require('enb-bem/techs/provide-deps'), {
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
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(), 'subtractFromTarget', 'from');
        } else {
            this._fromTarget = this.getRequiredOption('from');
        }

        this._whatTarget = this.getOption('subtractWhatTarget');
        if (this._whatTarget) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem', this.getName(), 'subtractWhatTarget', 'what');
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
                        .spread(function (fromDeps, whatDeps) {
                            var subtractedDeps = deps.subtract(fromDeps, whatDeps),
                                str = 'exports.deps = ' + JSON.stringify(subtractedDeps, null, 4) + ';';

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
