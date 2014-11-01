/**
 * bemjson-to-bemdecl
 * ==================
 *
 * Формирует BEMDECL-файл из BEMJSON-файла.
 *
 * Опции:
 *
 * `target`
 *
 * Тип: `String`. По умолчанию: `?.bemdecl.js`.
 * Результирующий BEMDECL-файл.
 *
 * `source`
 *
 * Тип: `String`. По умолчанию: `?.bemjson.js`.
 * Исходный BEMJSON-файл.
 *
 * Пример:
 *
 * ```js
 * var techs = require('enb-bem-techs'),
 * provide = require('enb/techs/file-provider');
 *
 * nodeConfig.addTechs([
 *     // Предоставляет BEMJSON-файл, написанный вручную, для ENB.
 *     // В опции `target` путь до BEMJSON-файла.
 *     [provide, { target: '?.bemjson.js' }],
 *
 *     // Строим BEMDECL-файл по полученному BEMJSON-файлу.
 *     // BEMJSON-файл берём из `?.bemjson.js`, т.к. опция `source` по умолчанию — `?.bemjson.js`.
 *     [techs.bemjsonToBemdecl]
 * ]);
 * ```
 */
var inherit = require('inherit'),
    vfs = require('enb/lib/fs/async-fs'),
    requireOrEval = require('enb/lib/fs/require-or-eval'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'bemjson-to-bemdecl';
    },

    configure: function () {
        var logger = this.node.getLogger();

        this._target = this.getOption('destTarget');
        if (this._target) {
            logger.logOptionIsDeprecated(this.node.unmaskTargetName(this._target), 'enb-bem-techs', this.getName(),
                'destTarget', 'target');
        } else {
            this._target = this.getOption('target', '?.bemdecl.js');
        }
        this._target = this.node.unmaskTargetName(this._target);

        this._sourceTarget = this.getOption('sourceTarget');
        if (this._sourceTarget) {
            logger.logOptionIsDeprecated(this._target, 'enb-bem-techs', this.getName(), 'sourceTarget', 'source');
        } else {
            this._sourceTarget = this.getOption('source', '?.bemjson.js');
        }
        this._sourceTarget = this.node.unmaskTargetName(this._sourceTarget);
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node,
            target = this._target,
            cache = node.getNodeCache(target),
            bemdeclFilename = node.resolvePath(target),
            bemjsonFilename = node.resolvePath(this._sourceTarget);

        return this.node.requireSources([this._sourceTarget])
            .then(function () {
                if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
                    cache.needRebuildFile('bemjson-file', bemjsonFilename)
                ) {
                    return requireOrEval(bemjsonFilename)
                        .then(function (bemjson) {
                            var bemjsonDeps = getDepsFromBemjson(bemjson),
                                bemdecl = deps.toBemdecl(bemjsonDeps),
                                str = 'exports.blocks = ' + JSON.stringify(bemdecl, null, 4) + ';\n';

                            return vfs.write(bemdeclFilename, str, 'utf-8')
                                .then(function () {
                                    cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                                    cache.cacheFileInfo('bemjson-file', bemjsonFilename);
                                    node.resolveTarget(target, { blocks: bemdecl });
                                });
                        });
                } else {
                    node.isValidTarget(target);
                    dropRequireCache(require, bemdeclFilename);

                    return asyncRequire(bemdeclFilename)
                        .then(function (result) {
                            node.resolveTarget(target, result);
                            return null;
                        });
                }
            });
    }
});

function getDepsFromBemjson(bemjson) {
    var deps = [];

    addDepsFromBemjson(bemjson, deps, {}, null);

    return deps;
}

function addDepsFromBemjson(bemjson, deps, depsIndex, parentBlockName) {
    if (!bemjson) { return; }
    if (Array.isArray(bemjson)) {
        bemjson.forEach(function (bemjsonItem) {
            addDepsFromBemjson(bemjsonItem, deps, depsIndex, parentBlockName);
        });
    } else {
        if (bemjson.block || bemjson.elem) {
            if (bemjson.elem && !bemjson.block) {
                bemjson.block = parentBlockName;
            }
            var dep = { block: bemjson.block };
            if (bemjson.elem) {
                dep.elem = bemjson.elem;
            }
            var itemKey = depKey(dep);
            if (!depsIndex[itemKey]) {
                deps.push(dep);
                depsIndex[itemKey] = true;
            }
            if (bemjson.elemMods) {
                bemjson.mods = bemjson.elemMods;
            }
            if (bemjson.mods) {
                for (var j in bemjson.mods) {
                    if (bemjson.mods.hasOwnProperty(j)) {
                        var subDep = { block: bemjson.block };
                        if (bemjson.elem) {
                            subDep.elem = bemjson.elem;
                        }
                        subDep.mod = j;
                        subDep.val = bemjson.mods[j];
                        var subItemKey = depKey(subDep);
                        if (!depsIndex[subItemKey]) {
                            deps.push(subDep);
                            depsIndex[subItemKey] = true;
                        }
                    }
                }
            }
        }
        for (var i in bemjson) {
            if (bemjson.hasOwnProperty(i)) {
                if (i !== 'mods' && i !== 'js' && i !== 'attrs') {
                    var value = bemjson[i];
                    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                        addDepsFromBemjson(bemjson[i], deps, depsIndex, bemjson.block || parentBlockName);
                    }
                }
            }
        }
    }
}

function depKey(dep) {
    return dep.block +
        (dep.elem ? '__' + dep.elem : '') +
        (dep.mod ? '_' + dep.mod + (dep.val ? '_' + dep.val : '') : '');
}
